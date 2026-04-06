const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const { createNotificationIfAllowed } = require("../utils/notificationDispatch");

function buildOrderResponse(order) {
  if (!order) return null;
  const plain = order.toObject ? order.toObject() : order;
  return plain;
}

function getRazorpayOrNull() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, instance: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
}

function razorpayErrorMessage(err) {
  if (!err || typeof err !== "object") return String(err);
  const e = err.error;
  if (e && typeof e === "object" && e.description) return String(e.description);
  if (e && typeof e === "string") return e;
  if (err.description) return String(err.description);
  return err.message || "Payment provider error";
}

function amountPaiseFromOrder(order) {
  const subtotal = Number(order.totalAmount) || 0;
  const fee = Number(order.platformFee) || 0;
  const rupees = subtotal + fee;
  return Math.round(rupees * 100);
}

async function populateOrderDoc(id) {
  return Order.findById(id)
    .populate("buyer", "name phone")
    .populate("farmer", "name phone")
    .populate({
      path: "items.product",
      select: "name images price unit",
    });
}

// POST /api/payments/create-order  body: { orderId: string } — app order _id
exports.createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can start online payment" });
    }

    const rz = getRazorpayOrNull();
    if (!rz) {
      return res.status(503).json({
        message:
          "Online payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or pay with COD.",
      });
    }

    const { orderId } = req.body || {};
    if (!orderId || !mongoose.Types.ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ message: "Valid orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (String(order.buyer) !== String(userId)) {
      return res.status(403).json({ message: "You cannot pay for this order" });
    }
    if (order.paymentMethod !== "razorpay") {
      return res
        .status(400)
        .json({ message: "This order is not set up for online payment." });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "This order is already paid." });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Cancelled orders cannot be paid." });
    }

    const amountPaise = amountPaiseFromOrder(order);
    if (amountPaise < 100) {
      return res.status(400).json({ message: "Order amount is too small for card/UPI checkout." });
    }

    // Razorpay requires a unique receipt per Orders API call (retries / Pay again).
    const receipt = `o${String(order._id).replace(/\W/g, "")}t${Date.now()}`.slice(0, 40);

    const rpOrder = await rz.instance.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { app_order_id: String(order._id) },
    });

    order.razorpayOrderId = rpOrder.id;
    await order.save();

    return res.json({
      keyId: rz.keyId,
      orderId: rpOrder.id,
      amount: amountPaise,
      currency: "INR",
    });
  } catch (err) {
    const msg = razorpayErrorMessage(err);
    const code = err.statusCode || err.status;
    console.error("Create Razorpay order error:", msg, err);
    const status = code >= 400 && code < 500 ? 502 : 500;
    return res.status(status).json({
      message: msg || "Could not start payment",
      code: err.error?.code,
    });
  }
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can verify payment" });
    }

    const rz = getRazorpayOrNull();
    if (!rz) {
      return res.status(503).json({ message: "Payment verification is not configured." });
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message:
          "orderId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (String(order.buyer) !== String(userId)) {
      return res.status(403).json({ message: "You cannot verify payment for this order" });
    }

    if (order.paymentStatus === "paid") {
      const populated = await populateOrderDoc(order._id);
      return res.json({
        success: true,
        alreadyPaid: true,
        order: buildOrderResponse(populated),
      });
    }

    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Payment does not match this order." });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", rz.keySecret).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    const populated = await populateOrderDoc(order._id);

    try {
      const subtotal = Number(order.totalAmount) || 0;
      const fee = Number(order.platformFee) || 0;
      const paidInr = subtotal + fee;
      await Promise.all([
        createNotificationIfAllowed(Notification, {
          userId: order.buyer,
          type: "payment",
          title: "Payment received",
          message: `Your payment of ₹${paidInr.toLocaleString("en-IN")} was successful. The farmer will prepare your order.`,
          link: "/buyer/orders",
        }),
        createNotificationIfAllowed(Notification, {
          userId: order.farmer,
          type: "payment",
          title: "Buyer paid online",
          message: `Order ${String(order._id).slice(-8)} — payment received online. You can accept and fulfil the order.`,
          link: "/farmer/orders",
        }),
      ]);
    } catch {
      // ignore
    }

    return res.json({
      success: true,
      order: buildOrderResponse(populated),
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({
      message: err.message || "Could not verify payment",
    });
  }
};
