const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
    },
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    processedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

withdrawalSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
