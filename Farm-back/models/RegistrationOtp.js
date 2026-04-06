const mongoose = require("mongoose");

/** Pending email verification during signup (one document per normalized email) */
const registrationOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RegistrationOtp", registrationOtpSchema);
