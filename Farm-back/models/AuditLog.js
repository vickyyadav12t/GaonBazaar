const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorRole: { type: String },
    /** e.g. kyc.approve, listing.remove, review.approve, user.patch */
    action: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: { type: String, required: true },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
