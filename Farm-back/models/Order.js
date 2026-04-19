const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

/** Buyer return / refund (Flipkart-style) after delivery */
const returnRequestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "refunded"],
      default: "none",
    },
    /** Machine key, e.g. quality_defective */
    reason: { type: String, trim: true, maxlength: 80 },
    details: { type: String, trim: true, maxlength: 2000 },
    requestedAt: { type: Date },
    resolvedAt: { type: Date },
    /** Farmer rejection note or system message */
    resolutionNote: { type: String, trim: true, maxlength: 1000 },
    refundAmount: { type: Number },
    razorpayRefundId: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    // Buyer platform fee (2% of subtotal); Razorpay charges subtotal + platformFee in paise.
    platformFee: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "bank_transfer"],
      default: "cod",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    shippingAddress: {
      type: String,
    },
    // optional negotiated price per unit (if negotiation flow used)
    negotiatedPrice: { type: Number },
    // true if availableQuantity was decremented on create (used to restore on cancel)
    stockAdjusted: { type: Boolean, default: false },
    /** Set when order first moves to delivered (return window anchor) */
    deliveredAt: { type: Date },
    returnRequest: { type: returnRequestSchema },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);

