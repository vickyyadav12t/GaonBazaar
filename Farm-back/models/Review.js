const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // usually farmer
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    reply: { type: String },
    replyDate: { type: Date },
    isApproved: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);

