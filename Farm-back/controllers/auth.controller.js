const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sanitizeUser } = require("./user.controller");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const JWT_EXPIRES_IN = "7d";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive exact email match filter */
function emailFilter(email) {
  const e = normalizeEmail(email);
  return { email: new RegExp(`^${escapeRegex(e)}$`, "i") };
}

const OTP_RESEND_MS = 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

// POST /api/auth/forgot-password — body: { email }; sends 6-digit OTP via SMTP
exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const { sendMail, isMailConfigured } = require("../utils/mail");
    if (!isMailConfigured()) {
      return res.status(503).json({
        message: "Password reset by email is not available. Try again later.",
      });
    }

    const generic = {
      message:
        "If an account exists for this email, a verification code has been sent.",
    };

    const user = await User.findOne(emailFilter(email)).select(
      "+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpSentAt"
    );

    if (!user || user.accountStatus !== "active" || !user.email) {
      return res.json(generic);
    }

    const now = Date.now();
    if (
      user.passwordResetOtpSentAt &&
      now - new Date(user.passwordResetOtpSentAt).getTime() < OTP_RESEND_MS
    ) {
      return res.status(429).json({
        message: "Please wait a minute before requesting another code.",
      });
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hash = crypto
      .createHash("sha256")
      .update(`${otp}:${JWT_SECRET}`)
      .digest("hex");

    user.passwordResetOtpHash = hash;
    user.passwordResetOtpExpires = new Date(now + OTP_TTL_MS);
    user.passwordResetOtpSentAt = new Date(now);
    await user.save();

    const appName = process.env.APP_NAME || "GaonBazaar";
    try {
      await sendMail({
        to: user.email,
        subject: `${appName} — password reset code`,
        text: `Your password reset code is: ${otp}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
        html: `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      console.error("Forgot-password mail error:", mailErr);
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetOtpSentAt = undefined;
      await user.save();
      return res.status(503).json({
        message: "Could not send email. Check SMTP settings or try again later.",
      });
    }

    return res.json(generic);
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/reset-password-with-otp — body: { email, otp, password }
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").replace(/\D/g, "");
    const password = String(req.body.password || "");

    if (!email || otp.length !== 6 || password.length < 6) {
      return res.status(400).json({
        message: "Email, 6-digit code, and password (at least 6 characters) are required",
      });
    }

    const hash = crypto
      .createHash("sha256")
      .update(`${otp}:${JWT_SECRET}`)
      .digest("hex");

    const user = await User.findOne(emailFilter(email)).select(
      "+passwordResetOtpHash +passwordResetOtpExpires +passwordResetTokenHash +passwordResetExpires"
    );

    if (
      !user ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpires ||
      user.passwordResetOtpExpires <= new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired code. Request a new code from the forgot-password page.",
      });
    }

    if (user.passwordResetOtpHash !== hash) {
      return res.status(400).json({ message: "Invalid code. Check the email and try again." });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        message:
          "Your account has been suspended. Contact support if you believe this is a mistake.",
      });
    }

    user.password = password;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpSentAt = undefined;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (err) {
    console.error("Reset password with OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/register/send-email-code — body: { email }; 6-digit code for signup
exports.sendRegistrationEmailCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const { sendMail, isMailConfigured } = require("../utils/mail");
    if (!isMailConfigured()) {
      return res.status(503).json({
        message: "Email verification is temporarily unavailable.",
      });
    }

    const existing = await User.findOne(emailFilter(email));
    if (existing) {
      return res.status(400).json({
        message: "An account already exists with this email.",
      });
    }

    const RegistrationOtp = require("../models/RegistrationOtp");
    const prev = await RegistrationOtp.findOne({ email });
    const now = Date.now();
    if (
      prev &&
      prev.sentAt &&
      now - new Date(prev.sentAt).getTime() < OTP_RESEND_MS
    ) {
      return res.status(429).json({
        message: "Please wait a minute before requesting another code.",
      });
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hash = crypto
      .createHash("sha256")
      .update(`${otp}:${JWT_SECRET}`)
      .digest("hex");

    await RegistrationOtp.findOneAndUpdate(
      { email },
      {
        otpHash: hash,
        expiresAt: new Date(now + OTP_TTL_MS),
        sentAt: new Date(now),
      },
      { upsert: true, new: true }
    );

    const appName = process.env.APP_NAME || "GaonBazaar";
    try {
      await sendMail({
        to: email,
        subject: `${appName} — verify your email`,
        text: `Your email verification code is: ${otp}\n\nIt expires in 10 minutes. If you did not sign up, ignore this email.`,
        html: `<p>Your email verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes. If you did not create an account, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      console.error("Registration OTP mail error:", mailErr);
      await RegistrationOtp.deleteOne({ email });
      return res.status(503).json({
        message: "Could not send email. Check SMTP settings or try again later.",
      });
    }

    return res.json({
      message: "Verification code sent to your email.",
    });
  } catch (err) {
    console.error("Send registration email code error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/register — JSON (buyer) or multipart/form-data (farmer + kycFile)
exports.register = async (req, res) => {
  let kycFileCommitted = false;
  const removeOrphanKycFile = () => {
    if (kycFileCommitted || !req.file?.path) return;
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (_) {}
  };

  const fail = (status, message) => {
    removeOrphanKycFile();
    return res.status(status).json({ message });
  };

  try {
    const {
      name,
      phone,
      email,
      password,
      role,
      state,
      district,
      village,
      emailVerificationCode,
      registrationOtp,
      kycDocType,
      ...rest
    } = req.body;

    if (!name || !phone || !password) {
      return fail(400, "Name, phone and password are required");
    }

    const normalizedRegisterEmail = normalizeEmail(email);
    if (
      !normalizedRegisterEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRegisterEmail)
    ) {
      return fail(400, "Valid email is required");
    }

    const code = String(
      emailVerificationCode || registrationOtp || ""
    ).replace(/\D/g, "");
    if (code.length !== 6) {
      return fail(400, "6-digit email verification code is required");
    }

    const RegistrationOtp = require("../models/RegistrationOtp");
    const otpDoc = await RegistrationOtp.findOne({
      email: normalizedRegisterEmail,
    });
    const expectedHash = crypto
      .createHash("sha256")
      .update(`${code}:${JWT_SECRET}`)
      .digest("hex");
    if (
      !otpDoc ||
      otpDoc.expiresAt < new Date() ||
      otpDoc.otpHash !== expectedHash
    ) {
      return fail(
        400,
        "Invalid or expired verification code. Go back and request a new code, or use Resend on the last step."
      );
    }

    const normalizedRole = String(role ?? "")
      .toLowerCase()
      .trim();
    if (normalizedRole === "admin") {
      return fail(
        403,
        "Admin accounts cannot be created through public registration."
      );
    }

    const allowedPublicRoles = ["farmer", "buyer"];
    let resolvedRole = "farmer";
    if (normalizedRole) {
      if (!allowedPublicRoles.includes(normalizedRole)) {
        return fail(
          400,
          "Invalid role. Registration is only available for farmers and buyers."
        );
      }
      resolvedRole = normalizedRole;
    }

    if (resolvedRole === "farmer") {
      if (!req.file) {
        return fail(
          400,
          "KYC document is required for farmer registration. Upload a PNG, JPG, or PDF (max 5MB) as the file field \"kycFile\"."
        );
      }
    } else if (req.file) {
      removeOrphanKycFile();
    }

    // Never allow role or privilege fields from leftover body
    const {
      role: _roleFromRest,
      emailVerified: _ev,
      accountStatus: _as,
      googleId: _gid,
      authProvider: _ap,
      kycDocuments: _kycD,
      kycStatus: _kycS,
      ...safeRest
    } = rest;

    const orConditions = [{ phone }, emailFilter(normalizedRegisterEmail)];

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) {
      return fail(400, "User already exists with this phone or email");
    }

    const userPayload = {
      name,
      phone,
      email: normalizedRegisterEmail,
      password,
      role: resolvedRole,
      emailVerified: true,
      location: {
        state,
        district,
        village,
      },
      ...safeRest,
    };

    if (resolvedRole === "farmer" && req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const fileUrl = `${baseUrl}/uploads/kyc/${req.file.filename}`;
      let docType = String(kycDocType || "aadhaar").toLowerCase();
      if (!["aadhaar", "kisan"].includes(docType)) docType = "aadhaar";
      userPayload.kycDocuments = [
        {
          docType,
          fileUrl,
          originalName: req.file.originalname || "",
          uploadedAt: new Date(),
          reviewStatus: "pending",
        },
      ];
      userPayload.kycStatus = "pending";
    }

    const user = new User(userPayload);

    await user.save();
    kycFileCommitted = true;
    await RegistrationOtp.deleteOne({ email: normalizedRegisterEmail });

    const token = generateToken(user);

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    removeOrphanKycFile();
    console.error("Register error:", err);

    // Handle common Mongoose validation / duplicate errors more clearly
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "User already exists with this phone or email" });
    }

    // Fallback
    return res
      .status(500)
      .json({ message: err.message || "Server error during registration" });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    const phoneTrim = phone != null ? String(phone).replace(/\s+/g, "").trim() : "";
    const emailNorm = email != null ? normalizeEmail(email) : "";

    if ((!phoneTrim && !emailNorm) || !password) {
      return res
        .status(400)
        .json({ message: "Phone or email and password are required" });
    }

    const query = phoneTrim ? { phone: phoneTrim } : emailFilter(emailNorm);
    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        message:
          "Your account has been suspended. Contact support if you believe this is a mistake.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/google — body: { credential } (Google ID token JWT from Sign-In)
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res
        .status(503)
        .json({ message: "Google sign-in is not configured on the server" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return res.status(401).json({ message: "Invalid Google token" });
    }
    if (payload.email_verified === false) {
      return res.status(403).json({ message: "Google email is not verified" });
    }

    const googleId = payload.sub;
    const email = payload.email
      ? String(payload.email).toLowerCase().trim()
      : "";
    const name = (payload.name && String(payload.name).trim()) || "User";
    const picture = payload.picture || "";

    let user = await User.findOne({ googleId });
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
        if (!user.emailVerified) user.emailVerified = true;
        await user.save();
      }
    }

    if (!user) {
      if (!email) {
        return res.status(400).json({
          message:
            "Your Google account does not share an email. Use another sign-in method.",
        });
      }
      user = new User({
        name,
        email,
        googleId,
        authProvider: "google",
        avatar: picture || undefined,
        role: "buyer",
        location: { state: "", district: "" },
        emailVerified: true,
      });
      await user.save();
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        message:
          "Your account has been suspended. Contact support if you believe this is a mistake.",
      });
    }

    const token = generateToken(user);
    return res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("Google login error:", err);
    const msg = err && err.message ? String(err.message) : "";
    if (msg.includes("Token used too late") || msg.includes("expired")) {
      return res
        .status(401)
        .json({ message: "Google sign-in expired. Please try again." });
    }
    return res
      .status(401)
      .json({ message: "Google sign-in failed. Please try again." });
  }
};

// POST /api/auth/reset-password
// body: { token, password } — token from email link (admin-triggered or future self-serve)
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || String(password).length < 6) {
      return res.status(400).json({
        message: "Valid reset token and password (at least 6 characters) are required",
      });
    }

    const hash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpires");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link. Request a new reset email." });
    }

    user.password = String(password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "Password updated. You can sign in with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

