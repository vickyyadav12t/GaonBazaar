const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendMail, isMailConfigured } = require("../utils/mail");
const { LINKED_ORDER_STAGES } = require("../utils/orderLinked");
const { prefsFromDoc, createNotificationIfAllowed } = require("../utils/notificationDispatch");

const ADMIN_ORDER_LIST_MAX_LIMIT = 100;
const ADMIN_ORDER_DEFAULT_LIMIT = 25;
const USER_ORDER_MAX_LIMIT = 100;
const USER_ORDER_DEFAULT_LIMIT = 50;
const USER_ORDER_STATUSES = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);

/** Log once per process if orders cannot send email due to missing SMTP. */
let warnedOrderEmailNoSmtp = false;

function formatInr(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN")}`;
}

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "processing" || s === "confirmed") return "Confirmed";
  if (s === "shipped") return "Shipped";
  if (s === "delivered") return "Delivered";
  if (s === "cancelled") return "Cancelled";
  return status;
}

function paymentMethodLabel(method) {
  const m = String(method || "").toLowerCase();
  if (m === "razorpay") return "Razorpay (UPI / card)";
  if (m === "cod") return "Cash on delivery";
  if (m === "bank_transfer") return "Bank transfer";
  return method;
}

function orderLinesSummary(orderDoc) {
  const items = Array.isArray(orderDoc?.items) ? orderDoc.items : [];
  return items
    .map((it) => `${it?.name || "Item"} — ${Number(it?.quantity) || 0} ${it?.unit || ""} × ${formatInr(it?.price)}`)
    .slice(0, 8)
    .join("\n");
}

async function safeSendOrderEmails({ orderDoc, kind, extra }) {
  try {
    if (!isMailConfigured()) {
      if (!warnedOrderEmailNoSmtp) {
        warnedOrderEmailNoSmtp = true;
        console.warn(
          "[mail] Order emails skipped: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS on the server)."
        );
      }
      return;
    }
    const buyerId = orderDoc?.buyer;
    const farmerId = orderDoc?.farmer;
    if (!buyerId || !farmerId) return;

    const [buyer, farmer, admins] = await Promise.all([
      User.findById(buyerId).select("name email notificationPreferences").lean(),
      User.findById(farmerId).select("name email notificationPreferences").lean(),
      User.find({ role: "admin", accountStatus: "active" })
        .select("name email")
        .lean(),
    ]);

    const appName = process.env.APP_NAME || "GaonBazaar";
    const oid = String(orderDoc?._id || "").slice(-8);
    const subtotal = Number(orderDoc?.totalAmount) || 0;
    const platformFee = Number(orderDoc?.platformFee) || 0;
    const buyerPays = subtotal + platformFee;
    const lines = orderLinesSummary(orderDoc);
    const negotiated = orderDoc?.negotiatedPrice != null ? Number(orderDoc.negotiatedPrice) : null;
    const negotiatedLine =
      negotiated != null && Number.isFinite(negotiated)
        ? `Negotiated price per unit: ${formatInr(negotiated)}`
        : "";

    const commonText = [
      `Order ID: ${oid ? `#${oid}` : String(orderDoc?._id || "")}`,
      `Status: ${statusLabel(orderDoc?.status)}`,
      `Payment: ${String(orderDoc?.paymentStatus || "pending")} (${paymentMethodLabel(orderDoc?.paymentMethod)})`,
      negotiatedLine,
      "",
      "Items:",
      lines || "—",
      "",
      `Subtotal (produce): ${formatInr(subtotal)}`,
      `Platform fee: ${formatInr(platformFee)}`,
      `Buyer pays: ${formatInr(buyerPays)}`,
      extra ? `\n${extra}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const commonHtml = commonText
      .split("\n")
      .map((l) => `<div>${String(l).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`)
      .join("");

    const subjectBase =
      kind === "placed"
        ? `${appName} — order placed`
        : kind === "status"
          ? `${appName} — order ${statusLabel(orderDoc?.status)}`
          : `${appName} — order update`;

    const buyerMailOk = prefsFromDoc(buyer).emailNotifications;
    const farmerMailOk = prefsFromDoc(farmer).emailNotifications;

    const mailJobs = [];
    if (buyer?.email && buyerMailOk) {
      mailJobs.push(
        sendMail({
          to: buyer.email,
          subject: subjectBase,
          text: `Hi ${buyer.name || "there"},\n\n${commonText}\n\nThanks,\n${appName}`,
          html: `<p>Hi ${buyer.name || "there"},</p>${commonHtml}<p style="margin-top:12px">Thanks,<br/>${appName}</p>`,
        })
      );
    }
    if (farmer?.email && farmerMailOk) {
      const farmerSubject =
        kind === "placed"
          ? `${appName} — new order received`
          : kind === "status"
            ? `${appName} — order ${statusLabel(orderDoc?.status)}`
            : `${appName} — order update`;
      mailJobs.push(
        sendMail({
          to: farmer.email,
          subject: farmerSubject,
          text: `Hi ${farmer.name || "there"},\n\n${commonText}\n\n— ${appName}`,
          html: `<p>Hi ${farmer.name || "there"},</p>${commonHtml}<p style="margin-top:12px">— ${appName}</p>`,
        })
      );
    }

    // Admin visibility (best-effort)
    const buyerName = buyer?.name || "Buyer";
    const farmerName = farmer?.name || "Farmer";
    const adminSubject =
      kind === "placed"
        ? `${appName} — new order (${buyerName} → ${farmerName})`
        : kind === "status"
          ? `${appName} — order ${statusLabel(orderDoc?.status)} (${buyerName} → ${farmerName})`
          : `${appName} — order update (${buyerName} → ${farmerName})`;

    const adminList = Array.isArray(admins) ? admins : [];
    for (const a of adminList) {
      if (!a?.email) continue;
      mailJobs.push(
        sendMail({
          to: a.email,
          subject: adminSubject,
          text: `Hi ${a.name || "Admin"},\n\nBuyer: ${buyerName}\nFarmer: ${farmerName}\n\n${commonText}\n\n— ${appName}`,
          html: `<p>Hi ${a.name || "Admin"},</p><p><b>Buyer:</b> ${buyerName}<br/><b>Farmer:</b> ${farmerName}</p>${commonHtml}<p style="margin-top:12px">— ${appName}</p>`,
        })
      );
    }

    if (mailJobs.length) {
      const results = await Promise.allSettled(mailJobs);
      results.forEach((r) => {
        if (r.status === "rejected") {
          const reason = r.reason;
          console.error(
            "[mail] Order email job failed:",
            reason?.message || reason?.code || String(reason)
          );
        }
      });
    }
  } catch (e) {
    console.error("Order email error:", e);
  }
}

async function rollbackStockDecrements(decremented) {
  for (const { id, qty } of [...decremented].reverse()) {
    await Product.updateOne({ _id: id }, { $inc: { availableQuantity: qty } });
    await Product.updateOne(
      { _id: id, status: "sold_out", availableQuantity: { $gt: 0 } },
      { $set: { status: "active" } }
    );
  }
}

async function restoreOrderStock(orderDoc) {
  for (const item of orderDoc.items || []) {
    const pid = item.product;
    const qty = item.quantity;
    if (!pid || !qty) continue;
    await Product.updateOne({ _id: pid }, { $inc: { availableQuantity: qty } });
    const p = await Product.findById(pid).select("availableQuantity status").lean();
    if (p && p.availableQuantity > 0 && p.status === "sold_out") {
      await Product.updateOne({ _id: pid }, { $set: { status: "active" } });
    }
  }
}

const buildOrderResponse = (order) => {
  if (!order) return null;
  const plain = order.toObject ? order.toObject() : order;
  return plain;
};

/** Admin list/export: status, paymentStatus, optional createdAt range (dateFrom / dateTo ISO or date-only). */
function buildAdminOrderMatch(req) {
  const filter = {};
  const status = req.query.status != null && String(req.query.status).trim();
  if (status && status !== "all") {
    filter.status = status;
  }
  const paymentStatus = req.query.paymentStatus != null && String(req.query.paymentStatus).trim();
  if (paymentStatus && paymentStatus !== "all") {
    filter.paymentStatus = paymentStatus;
  }
  const dateFrom = req.query.dateFrom != null && String(req.query.dateFrom).trim();
  const dateTo = req.query.dateTo != null && String(req.query.dateTo).trim();
  if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!Number.isNaN(d.getTime())) range.$gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        range.$lte = d;
      }
    }
    if (Object.keys(range).length) filter.createdAt = range;
  }
  return filter;
}

async function linkedOrderIdsPage(match, skip, limit) {
  const pipeline = [
    { $match: match },
    ...LINKED_ORDER_STAGES,
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        slice: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 1 } }],
        total: [{ $count: "n" }],
      },
    },
  ];
  const [row] = await Order.aggregate(pipeline);
  const total = row?.total?.[0]?.n ?? 0;
  const ids = (row?.slice || []).map((r) => r._id);
  return { ids, total };
}

async function linkedOrderIdsForExport(match, maxRows) {
  const pipeline = [
    { $match: match },
    ...LINKED_ORDER_STAGES,
    { $sort: { createdAt: -1 } },
    { $limit: maxRows },
    { $project: { _id: 1 } },
  ];
  const rows = await Order.aggregate(pipeline);
  return rows.map((r) => r._id);
}

async function loadOrdersByIdsInOrder(ids) {
  if (!ids.length) return [];
  const orders = await Order.find({ _id: { $in: ids } })
    .populate("buyer", "name phone")
    .populate("farmer", "name phone")
    .populate({
      path: "items.product",
      select: "name images price unit",
    });
  const map = new Map(orders.map((o) => [String(o._id), o]));
  return ids.map((id) => map.get(String(id))).filter(Boolean);
}

/** Populated ref (doc with _id) or raw ObjectId — for JWT user id comparison */
function refUserId(ref) {
  if (ref == null) return "";
  if (typeof ref === "object" && ref._id != null) return String(ref._id);
  return String(ref);
}

// GET /api/orders
// Buyer / farmer: paginated (limit, skip, optional includeTotal, status, paymentStatus=pending). Admin: linked orders + filters.
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const filter = {};

    if (role === "buyer") {
      filter.buyer = userId;
    } else if (role === "farmer") {
      filter.farmer = userId;
    }

    if (role === "buyer" || role === "farmer") {
      const st = req.query.status != null && String(req.query.status).trim().toLowerCase();
      if (st && st !== "all" && USER_ORDER_STATUSES.has(st)) {
        filter.status = st;
      }
      const pay = req.query.paymentStatus != null && String(req.query.paymentStatus).trim().toLowerCase();
      if (pay === "pending") {
        filter.paymentStatus = "pending";
      }
      const limitNum = Math.min(
        USER_ORDER_MAX_LIMIT,
        Math.max(1, Number(req.query.limit) || USER_ORDER_DEFAULT_LIMIT)
      );
      const skipNum = Math.max(0, Number(req.query.skip) || 0);
      let total;
      if (String(req.query.includeTotal || "").toLowerCase() === "true") {
        total = await Order.countDocuments(filter);
      }
      const orders = await Order.find(filter)
        .populate("buyer", "name phone")
        .populate("farmer", "name phone")
        .populate({
          path: "items.product",
          select: "name images price unit",
        })
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);

      return res.json({
        orders: orders.map(buildOrderResponse),
        ...(typeof total === "number" ? { total } : {}),
        skip: skipNum,
        limit: limitNum,
      });
    }

    if (role === "admin") {
      const match = buildAdminOrderMatch(req);
      const limitNum = Math.min(
        ADMIN_ORDER_LIST_MAX_LIMIT,
        Math.max(1, Number(req.query.limit) || ADMIN_ORDER_DEFAULT_LIMIT)
      );
      const skipNum = Math.max(0, Number(req.query.skip) || 0);
      const { ids, total } = await linkedOrderIdsPage(match, skipNum, limitNum);
      const orders = await loadOrdersByIdsInOrder(ids);
      return res.json({
        orders: orders.map(buildOrderResponse),
        total,
        skip: skipNum,
        limit: limitNum,
      });
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (err) {
    console.error("Get orders error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching orders",
    });
  }
};

const EXPORT_ROW_LIMIT = 5000;

// GET /api/orders/export.csv — same visibility as GET /api/orders (buyer / farmer / admin). Admin: same filters as list (query params), up to EXPORT_ROW_LIMIT linked rows.
exports.exportOrdersCsv = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const filter = {};
    if (role === "buyer") {
      filter.buyer = userId;
    } else if (role === "farmer") {
      filter.farmer = userId;
    }

    if (role === "buyer" || role === "farmer") {
      const st = req.query.status != null && String(req.query.status).trim().toLowerCase();
      if (st && st !== "all" && USER_ORDER_STATUSES.has(st)) {
        filter.status = st;
      }
      const pay = req.query.paymentStatus != null && String(req.query.paymentStatus).trim().toLowerCase();
      if (pay === "pending") {
        filter.paymentStatus = "pending";
      }
    }

    let orders;
    if (role === "admin") {
      const match = buildAdminOrderMatch(req);
      const ids = await linkedOrderIdsForExport(match, EXPORT_ROW_LIMIT);
      orders = await loadOrdersByIdsInOrder(ids);
      orders = orders.map((o) => (o.toObject ? o.toObject() : o));
    } else {
      orders = await Order.find(filter)
        .populate("buyer", "name phone")
        .populate("farmer", "name phone")
        .sort({ createdAt: -1 })
        .limit(EXPORT_ROW_LIMIT)
        .lean();
    }

    const { rowsToCsv, withUtf8Bom } = require("../utils/csv");
    const header = [
      "id",
      "createdAt",
      "updatedAt",
      "status",
      "paymentStatus",
      "totalAmount",
      "platformFee",
      "paymentMethod",
      "buyerName",
      "buyerPhone",
      "farmerName",
      "farmerPhone",
      "itemsSummary",
      "shippingAddress",
      "razorpayOrderId",
      "razorpayPaymentId",
    ];
    const rows = [header];

    for (const o of orders) {
      const buyer = o.buyer;
      const farmer = o.farmer;
      const itemsSummary = (o.items || [])
        .map((it) => `${it.name || "item"} x${it.quantity}`)
        .join("; ");
      rows.push([
        String(o._id),
        o.createdAt ? new Date(o.createdAt).toISOString() : "",
        o.updatedAt ? new Date(o.updatedAt).toISOString() : "",
        o.status || "",
        o.paymentStatus || "",
        String(o.totalAmount ?? ""),
        String(o.platformFee ?? ""),
        o.paymentMethod || "",
        buyer?.name || "",
        buyer?.phone || "",
        farmer?.name || "",
        farmer?.phone || "",
        itemsSummary,
        o.shippingAddress || "",
        o.razorpayOrderId || "",
        o.razorpayPaymentId || "",
      ]);
    }

    const body = withUtf8Bom(rowsToCsv(rows));
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="orders-${stamp}.csv"`);
    return res.send(body);
  } catch (err) {
    console.error("Export orders CSV error:", err);
    return res.status(500).json({
      message: err.message || "Server error while exporting orders",
    });
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("buyer", "name phone")
      .populate("farmer", "name phone")
      .populate({
        path: "items.product",
        select: "name images price unit",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user?.id;
    const role = req.user?.role;

    if (
      role !== "admin" &&
      refUserId(order.buyer) !== String(userId) &&
      refUserId(order.farmer) !== String(userId)
    ) {
      return res.status(403).json({ message: "Access denied to this order" });
    }

    return res.json({ order: buildOrderResponse(order) });
  } catch (err) {
    console.error("Get order by id error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching order",
    });
  }
};

// POST /api/orders
// Buyer creates order from cart — validates stock, decrements availableQuantity atomically.
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== "buyer") {
      return res
        .status(403)
        .json({ message: "Only buyers can create orders" });
    }

    const { items, shippingAddress, negotiatedPrice, paymentMethod: rawPaymentMethod } =
      req.body;

    const allowedPay = ["cod", "razorpay", "bank_transfer"];
    const payRaw =
      rawPaymentMethod != null ? String(rawPaymentMethod).toLowerCase().trim() : "cod";
    const paymentMethod = allowedPay.includes(payRaw) ? payRaw : "cod";

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    const aggregateQty = new Map();
    for (const item of items) {
      const rawId = item.productId || item.product;
      const pid = rawId != null ? String(rawId).trim() : "";
      if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
        return res.status(400).json({ message: "Invalid product in order" });
      }
      const q = Number(item.quantity) || 0;
      if (q <= 0) {
        return res.status(400).json({ message: "Item quantity must be > 0" });
      }
      aggregateQty.set(pid, (aggregateQty.get(pid) || 0) + q);
    }

    const productIds = [...aggregateQty.keys()];
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "Invalid product in order" });
    }

    const productById = new Map(products.map((p) => [String(p._id), p]));
    const farmerId = productById.get(productIds[0]).farmer;

    for (const pid of productIds) {
      const prod = productById.get(pid);
      if (prod.farmer.toString() !== farmerId.toString()) {
        return res.status(400).json({
          message:
            "All items must be from the same farmer. Remove other farmers' products or place separate orders.",
        });
      }
    }

    const negotiatedNum =
      negotiatedPrice != null && Number.isFinite(Number(negotiatedPrice))
        ? Number(negotiatedPrice)
        : null;

    const orderItems = [];
    let totalAmount = 0;
    const decremented = [];
    let savedOrder;

    try {
      for (const pid of productIds) {
        const prod = productById.get(pid);
        const qty = aggregateQty.get(pid);
        const minQ = prod.minOrderQuantity != null ? prod.minOrderQuantity : 1;

        if (prod.status !== "active") {
          await rollbackStockDecrements(decremented);
          return res.status(400).json({
            message: `«${prod.name}» is not available for sale.`,
          });
        }

        if (qty < minQ) {
          await rollbackStockDecrements(decremented);
          return res.status(400).json({
            message: `Minimum order for «${prod.name}» is ${minQ} ${prod.unit}.`,
          });
        }

        if (prod.availableQuantity < qty) {
          await rollbackStockDecrements(decremented);
          return res.status(400).json({
            message: `Not enough stock for «${prod.name}». Only ${prod.availableQuantity} ${prod.unit} available.`,
          });
        }

        const pricePerUnit =
          negotiatedNum != null && negotiatedNum > 0 ? negotiatedNum : prod.price;
        const itemTotal = pricePerUnit * qty;
        totalAmount += itemTotal;

        const updated = await Product.findOneAndUpdate(
          {
            _id: prod._id,
            status: "active",
            availableQuantity: { $gte: qty },
          },
          { $inc: { availableQuantity: -qty } },
          { new: true }
        );

        if (!updated) {
          await rollbackStockDecrements(decremented);
          return res.status(400).json({
            message: `Not enough stock for «${prod.name}». Another order may have just completed.`,
          });
        }

        decremented.push({ id: prod._id, qty });

        if (updated.availableQuantity <= 0) {
          await Product.updateOne({ _id: prod._id }, { $set: { status: "sold_out" } });
        }

        orderItems.push({
          product: prod._id,
          name: prod.name,
          price: pricePerUnit,
          unit: prod.unit,
          quantity: qty,
          totalPrice: itemTotal,
        });
      }

      const platformFee = Math.round(totalAmount * 0.02);

      savedOrder = new Order({
        buyer: userId,
        farmer: farmerId,
        items: orderItems,
        totalAmount,
        platformFee,
        paymentMethod,
        shippingAddress,
        negotiatedPrice: negotiatedNum != null ? negotiatedNum : undefined,
        stockAdjusted: true,
      });

      await savedOrder.save();
    } catch (innerErr) {
      if (decremented.length) {
        await rollbackStockDecrements(decremented);
      }
      throw innerErr;
    }

    const buyerPaysNotify =
      (savedOrder.totalAmount || 0) + (savedOrder.platformFee || 0);

    // Notify buyer and farmer
    try {
      await Promise.all([
        createNotificationIfAllowed(Notification, {
          userId,
          type: "order",
          title: "Order placed",
          message: `Your order total is ₹${buyerPaysNotify.toLocaleString("en-IN")} (including platform fee). ${
            paymentMethod === "razorpay"
              ? "Complete payment online when prompted."
              : paymentMethod === "cod"
                ? "Pay the farmer when you receive delivery (COD)."
                : "Complete bank transfer using details shared by the farmer."
          }`,
          link: "/buyer/orders",
        }),
        createNotificationIfAllowed(Notification, {
          userId: farmerId,
          type: "order",
          title: "New order received",
          message: `New order worth ₹${totalAmount.toLocaleString("en-IN")} (produce). ${
            paymentMethod === "razorpay"
              ? "Buyer will pay online."
              : paymentMethod === "cod"
                ? "Payment on delivery (COD)."
                : "Buyer selected bank transfer."
          }`,
          link: "/farmer/orders",
        }),
      ]);
    } catch {
      // ignore notification errors
    }

    // Admin notifications (best-effort)
    try {
      const admins = await User.find({ role: "admin", accountStatus: "active" })
        .select("_id")
        .lean();
      if (admins?.length) {
        const buyerName = (await User.findById(userId).select("name").lean())?.name || "Buyer";
        const farmerName = (await User.findById(farmerId).select("name").lean())?.name || "Farmer";
        await Promise.all(
          admins.map((a) =>
            createNotificationIfAllowed(Notification, {
              userId: a._id,
              type: "order",
              title: "New order placed",
              message: `${buyerName} placed an order with ${farmerName} for ${formatInr(totalAmount)} (produce).`,
              link: "/admin/dashboard",
            })
          )
        );
      }
    } catch {
      // ignore admin notification errors
    }

    // Email buyer + farmer (best-effort; no effect if SMTP not configured)
    void safeSendOrderEmails({
      orderDoc: savedOrder,
      kind: "placed",
      extra:
        paymentMethod === "razorpay"
          ? "If you haven't paid yet, complete payment from your order details."
          : paymentMethod === "cod"
            ? "Pay the farmer when you receive delivery (COD)."
            : "Complete bank transfer using details shared by the farmer.",
    });

    return res.status(201).json({ order: buildOrderResponse(savedOrder) });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({
      message: err.message || "Server error while creating order",
    });
  }
};

// PUT /api/orders/:id
// Update order (status, paymentStatus, address)
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Farmer can update status; admin can update anything; buyer can only update shippingAddress (optional)
    if (role === "farmer") {
      if (refUserId(order.farmer) !== String(userId)) {
        return res
          .status(403)
          .json({ message: "You are not allowed to update this order" });
      }
    } else if (role === "buyer") {
      if (refUserId(order.buyer) !== String(userId)) {
        return res
          .status(403)
          .json({ message: "You are not allowed to update this order" });
      }
    }

    const { status, paymentStatus, shippingAddress } = req.body;
    const prevStatus = order.status;
    const prevPaymentStatus = order.paymentStatus;

    if (status && (role === "farmer" || role === "admin")) {
      order.status = status;
    }

    if (paymentStatus) {
      if (role === "admin") {
        order.paymentStatus = paymentStatus;
      } else if (
        role === "farmer" &&
        paymentStatus === "paid" &&
        refUserId(order.farmer) === String(userId) &&
        ["cod", "bank_transfer"].includes(order.paymentMethod)
      ) {
        if (order.paymentStatus === "pending") {
          order.paymentStatus = "paid";
        } else if (order.paymentStatus !== "paid") {
          return res.status(400).json({
            message:
              "Only a pending COD or bank transfer payment can be marked as received.",
          });
        }
      } else if (paymentStatus && role !== "admin") {
        return res
          .status(403)
          .json({ message: "You are not allowed to update payment status" });
      }
    }

    if (shippingAddress && (role === "buyer" || role === "admin")) {
      order.shippingAddress = shippingAddress;
    }

    if (
      status === "cancelled" &&
      prevStatus !== "cancelled" &&
      order.stockAdjusted
    ) {
      await restoreOrderStock(order);
      order.stockAdjusted = false;
    }

    await order.save();

    // Send status/payment notifications
    try {
      const notifications = [];

      if (status && status !== prevStatus) {
        const statusMsg = `Order status updated to '${status}'.`;
        notifications.push(
          createNotificationIfAllowed(Notification, {
            userId: order.buyer,
            type: "order",
            title: "Order status updated",
            message: statusMsg,
            link: "/buyer/orders",
          })
        );
        notifications.push(
          createNotificationIfAllowed(Notification, {
            userId: order.farmer,
            type: "order",
            title: "Order status updated",
            message: statusMsg,
            link: "/farmer/orders",
          })
        );
      }

      if (paymentStatus && paymentStatus !== prevPaymentStatus) {
        const payMsg = `Payment status updated to '${paymentStatus}'.`;
        notifications.push(
          createNotificationIfAllowed(Notification, {
            userId: order.buyer,
            type: "payment",
            title: "Payment status updated",
            message: payMsg,
            link: "/buyer/orders",
          })
        );
        notifications.push(
          createNotificationIfAllowed(Notification, {
            userId: order.farmer,
            type: "payment",
            title: "Payment status updated",
            message: payMsg,
            link: "/farmer/orders",
          })
        );
      }

      if (notifications.length) {
        await Promise.all(notifications);
      }
    } catch {
      // ignore notification errors
    }

    if (status && status !== prevStatus) {
      void safeSendOrderEmails({
        orderDoc: order,
        kind: "status",
        extra: `Status changed from '${statusLabel(prevStatus)}' to '${statusLabel(status)}'.`,
      });
    }

    // Admin notifications on status changes (best-effort)
    if (status && status !== prevStatus) {
      try {
        const admins = await User.find({ role: "admin", accountStatus: "active" })
          .select("_id")
          .lean();
        if (admins?.length) {
          const [buyer, farmer] = await Promise.all([
            User.findById(order.buyer).select("name").lean(),
            User.findById(order.farmer).select("name").lean(),
          ]);
          const buyerName = buyer?.name || "Buyer";
          const farmerName = farmer?.name || "Farmer";
          await Promise.all(
            admins.map((a) =>
              createNotificationIfAllowed(Notification, {
                userId: a._id,
                type: "order",
                title: "Order status updated",
                message: `Order ${String(order._id).slice(-8)}: ${buyerName} → ${farmerName} is now '${statusLabel(status)}'.`,
                link: "/admin/dashboard",
              })
            )
          );
        }
      } catch {
        // ignore admin notification errors
      }
    }

    return res.json({ order: buildOrderResponse(order) });
  } catch (err) {
    console.error("Update order error:", err);
    return res.status(500).json({
      message: err.message || "Server error while updating order",
    });
  }
};

// POST /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Buyer can cancel own pending order; farmer can cancel own order; admin can cancel any
    if (role === "buyer") {
      if (refUserId(order.buyer) !== String(userId)) {
        return res
          .status(403)
          .json({ message: "You are not allowed to cancel this order" });
      }
    } else if (role === "farmer") {
      if (refUserId(order.farmer) !== String(userId)) {
        return res
          .status(403)
          .json({ message: "You are not allowed to cancel this order" });
      }
    } else if (role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed to cancel this order" });
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "This order cannot be cancelled" });
    }

    if (order.stockAdjusted) {
      await restoreOrderStock(order);
      order.stockAdjusted = false;
    }

    order.status = "cancelled";
    await order.save();

    // Notify buyer and farmer
    try {
      await Promise.all([
        createNotificationIfAllowed(Notification, {
          userId: order.buyer,
          type: "order",
          title: "Order cancelled",
          message: "Your order has been cancelled.",
          link: "/buyer/orders",
        }),
        createNotificationIfAllowed(Notification, {
          userId: order.farmer,
          type: "order",
          title: "Order cancelled",
          message: "An order assigned to you has been cancelled.",
          link: "/farmer/orders",
        }),
      ]);
    } catch {
      // ignore notification errors
    }

    return res.json({ order: buildOrderResponse(order) });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({
      message: err.message || "Server error while cancelling order",
    });
  }
};

