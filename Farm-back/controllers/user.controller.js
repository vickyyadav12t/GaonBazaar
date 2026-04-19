const User = require("../models/User");
const { rewriteLocalhostUploadUrl } = require("../utils/publicAssetUrl");

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  if (plain.avatar) {
    plain.avatar = rewriteLocalhostUploadUrl(String(plain.avatar));
  }
  return plain;
};

exports.sanitizeUser = sanitizeUser;

// GET /api/users/profile
// Protected: requires JWT (see middleware/auth.js)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Get profile error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Server error while fetching profile" });
  }
};

// PUT /api/users/profile
// Protected: requires JWT
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    const existing = await User.findById(userId);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      name,
      phone,
      email,
      state,
      district,
      village,
      avatar,
      businessName,
      businessType,
      gstNumber,
      businessAddress,
      farmSize,
      crops,
      bio,
      calendarHighlightCategories,
      notificationPreferences,
    } = req.body;

    const $set = {};

    if (name !== undefined) $set.name = name;
    if (phone !== undefined) $set.phone = phone;
    if (email !== undefined) $set.email = email;
    if (avatar !== undefined) $set.avatar = avatar;

    if (state !== undefined) $set["location.state"] = state;
    if (district !== undefined) $set["location.district"] = district;
    if (village !== undefined) $set["location.village"] = village;

    if (existing.role === "buyer") {
      if (businessName !== undefined) $set.businessName = businessName;
      if (businessType !== undefined) $set.businessType = businessType;
      if (gstNumber !== undefined) $set.gstNumber = gstNumber;
      if (businessAddress !== undefined) $set.businessAddress = businessAddress;
    }

    if (existing.role === "farmer") {
      if (farmSize !== undefined) $set.farmSize = farmSize;
      if (crops !== undefined) $set.crops = crops;
      if (bio !== undefined) $set.bio = bio;
      if (calendarHighlightCategories !== undefined) {
        if (!Array.isArray(calendarHighlightCategories)) {
          return res.status(400).json({ message: "calendarHighlightCategories must be an array" });
        }
        $set.calendarHighlightCategories = calendarHighlightCategories;
      }
    }

    if (notificationPreferences !== undefined && notificationPreferences !== null) {
      if (typeof notificationPreferences !== "object" || Array.isArray(notificationPreferences)) {
        return res.status(400).json({ message: "notificationPreferences must be an object" });
      }
      const keys = [
        "emailNotifications",
        "pushNotifications",
        "orderUpdates",
        "messageNotifications",
        "reviewNotifications",
        "promotionalEmails",
      ];
      for (const k of keys) {
        if (typeof notificationPreferences[k] === "boolean") {
          $set[`notificationPreferences.${k}`] = notificationPreferences[k];
        }
      }
    }

    if (Object.keys($set).length === 0) {
      return res.json({ user: sanitizeUser(existing) });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Update profile error:", err);

    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Phone or email already in use by another account" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({
      message: err.message || "Server error while updating profile",
    });
  }
};

// POST /api/users/kyc
// Body: { docType: 'aadhaar'|'kisan', fileUrl, originalName? }
// Farmer uploads file to POST /api/uploads/kyc first, then submits metadata here.
exports.submitKycDocument = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { docType, fileUrl, originalName } = req.body;

    const allowed = ["aadhaar", "kisan"];
    if (!docType || !allowed.includes(docType)) {
      return res.status(400).json({
        message: "Invalid or missing docType. Allowed: aadhaar, kisan.",
      });
    }
    if (!fileUrl || typeof fileUrl !== "string") {
      return res.status(400).json({ message: "fileUrl is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can submit KYC documents" });
    }

    user.kycDocuments = (user.kycDocuments || []).filter((d) => d.docType !== docType);
    user.kycDocuments.push({
      docType,
      fileUrl,
      originalName: typeof originalName === "string" ? originalName : "",
      uploadedAt: new Date(),
      reviewStatus: "pending",
    });
    user.kycStatus = "pending";
    await user.save();

    return res.json({
      message: "Document submitted. Pending admin verification.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Submit KYC document error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Server error while saving KYC document" });
  }
};

