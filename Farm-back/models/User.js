const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const locationSchema = new mongoose.Schema(
  {
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    village: { type: String },
  },
  { _id: false }
);

const notificationPreferencesSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    messageNotifications: { type: Boolean, default: true },
    reviewNotifications: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: false },
  },
  { _id: false }
);

const kycDocumentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: ["aadhaar", "kisan", "bank"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    originalName: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    email: { type: String },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      default: "farmer",
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    emailVerified: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    /** Email OTP self-serve reset (hashed 6-digit code) */
    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpires: { type: Date, select: false },
    passwordResetOtpSentAt: { type: Date, select: false },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    /** Set when admin rejects KYC; cleared on approval */
    kycRejectionReason: { type: String, trim: true, maxlength: 2000 },
    kycDocuments: { type: [kycDocumentSchema], default: [] },
    avatar: { type: String },
    businessName: { type: String, trim: true },
    businessType: {
      type: String,
      enum: ["retailer", "wholesaler", "processor", "individual"],
    },
    gstNumber: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    farmSize: { type: String, trim: true },
    crops: { type: String, trim: true },
    /** Farmer: marketplace category slugs to highlight on seasonal guide when they have no active listings (e.g. ["vegetables","grains"]). */
    calendarHighlightCategories: {
      type: [String],
      default: undefined,
      validate: {
        validator(arr) {
          if (!arr || arr.length === 0) return true;
          if (arr.length > 12) return false;
          const allowed = new Set([
            "vegetables",
            "fruits",
            "grains",
            "pulses",
            "spices",
            "dairy",
            "other",
          ]);
          return arr.every((c) => allowed.has(c));
        },
        message: "calendarHighlightCategories must be valid crop category ids (max 12)",
      },
    },
    bio: { type: String, trim: true, maxlength: 2000 },
    location: locationSchema,
    notificationPreferences: { type: notificationPreferencesSchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
// Use async middleware without `next` callback (Mongoose handles errors from async)
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password with stored hash
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

