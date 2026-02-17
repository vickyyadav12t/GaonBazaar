const User = require("../models/User");

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  return plain;
};

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
    const {
      name,
      phone,
      email,
      state,
      district,
      village,
      ...rest
    } = req.body;

    const update = { ...rest };

    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;

    if (state !== undefined || district !== undefined || village !== undefined) {
      update.location = {};
      if (state !== undefined) update.location.state = state;
      if (district !== undefined) update.location.district = district;
      if (village !== undefined) update.location.village = village;
    }

    // Optional: prevent direct password update here (use a separate endpoint)
    if (update.password) {
      delete update.password;
    }

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    });

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
// Protected: requires JWT
// NOTE: For now we don't persist the file, we just mark KYC as pending.
exports.uploadKYC = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { kycStatus: "pending" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "KYC uploaded (placeholder). Verification pending.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Upload KYC error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Server error while uploading KYC" });
  }
};

