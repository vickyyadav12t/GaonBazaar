const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    fromRole: { type: String, enum: ["user", "admin"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 20000 },
    authorName: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestEmail: { type: String, trim: true, default: "" },
    subject: { type: String, required: true, trim: true, maxlength: 500 },
    message: { type: String, required: true, trim: true, maxlength: 20000 },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    replies: [replySchema],
    emailNotified: { type: Boolean, default: false },
    lastReplyAt: { type: Date },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ subject: "text", message: "text" });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
