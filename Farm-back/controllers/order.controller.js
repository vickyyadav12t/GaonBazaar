const Order = require("../models/Order");
const Product = require("../models/Product");

const buildOrderResponse = (order) => {
  if (!order) return null;
  const plain = order.toObject ? order.toObject() : order;
  return plain;
};

// GET /api/orders
// Buyer: own orders; Farmer: orders for their products; Admin: all
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

    const orders = await Order.find(filter)
      .populate("buyer", "name phone")
      .populate("farmer", "name phone")
      .sort({ createdAt: -1 });

    return res.json({
      orders: orders.map(buildOrderResponse),
    });
  } catch (err) {
    console.error("Get orders error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching orders",
    });
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("buyer", "name phone")
      .populate("farmer", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user?.id;
    const role = req.user?.role;

    if (
      role !== "admin" &&
      order.buyer.toString() !== userId &&
      order.farmer.toString() !== userId
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
// Buyer creates order from cart
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== "buyer") {
      return res
        .status(403)
        .json({ message: "Only buyers can create orders" });
    }

    const { items, shippingAddress, negotiatedPrice } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    // For now we assume all items belong to the same farmer
    const firstItem = items[0];
    const product = await Product.findById(firstItem.productId || firstItem.product);

    if (!product) {
      return res.status(400).json({ message: "Invalid product in order" });
    }

    const farmerId = product.farmer;

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const prod = await Product.findById(item.productId || item.product);
      if (!prod) {
        return res.status(400).json({ message: "Invalid product in order" });
      }

      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: "Item quantity must be > 0" });
      }

      const pricePerUnit = negotiatedPrice || prod.price;
      const itemTotal = pricePerUnit * qty;
      totalAmount += itemTotal;

      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: pricePerUnit,
        unit: prod.unit,
        quantity: qty,
        totalPrice: itemTotal,
      });
    }

    const order = new Order({
      buyer: userId,
      farmer: farmerId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      negotiatedPrice,
    });

    await order.save();

    return res.status(201).json({ order: buildOrderResponse(order) });
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
      if (order.farmer.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You are not allowed to update this order" });
      }
    } else if (role === "buyer") {
      if (order.buyer.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You are not allowed to update this order" });
      }
    }

    const { status, paymentStatus, shippingAddress } = req.body;

    if (status && (role === "farmer" || role === "admin")) {
      order.status = status;
    }

    if (paymentStatus && role === "admin") {
      order.paymentStatus = paymentStatus;
    }

    if (shippingAddress && (role === "buyer" || role === "admin")) {
      order.shippingAddress = shippingAddress;
    }

    await order.save();

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

    // Buyer can cancel own pending order; admin can cancel any
    if (role === "buyer") {
      if (order.buyer.toString() !== userId) {
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

    order.status = "cancelled";
    await order.save();

    return res.json({ order: buildOrderResponse(order) });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({
      message: err.message || "Server error while cancelling order",
    });
  }
};

