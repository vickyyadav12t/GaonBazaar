const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      required: true,
    },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "offer", "counter_offer", "deal_accepted", "deal_rejected"],
      default: "text",
    },
    offerPrice: { type: Number },
    isRead: { type: Boolean, default: false },
  },
  {
    _id: true,
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

const chatSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    negotiationStatus: {
      type: String,
      enum: ["ongoing", "accepted", "rejected", "completed"],
      default: "ongoing",
    },
    currentOffer: { type: Number },
    originalPrice: { type: Number, required: true },
    lastMessage: { type: String, default: "" },
    lastMessageTime: { type: Date },
    unreadCountBuyer: { type: Number, default: 0 },
    unreadCountFarmer: { type: Number, default: 0 },
    /** Throttle email alerts to farmer when buyer starts/continues negotiation. */
    lastFarmerEmailNotifiedAt: { type: Date },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);

