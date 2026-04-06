const express = require("express");
const {
  register,
  login,
  resetPassword,
  googleLogin,
  forgotPassword,
  resetPasswordWithOtp,
  sendRegistrationEmailCode,
} = require("../controllers/auth.controller");
const { registerUploadMiddleware } = require("../middleware/registerUpload");

const router = express.Router();

// POST /api/auth/register/send-email-code — must be registered before /register
router.post("/register/send-email-code", sendRegistrationEmailCode);

// POST /api/auth/register — multipart for farmers (kycFile); JSON for buyers
router.post("/register", registerUploadMiddleware, register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google
router.post("/google", googleLogin);

// POST /api/auth/forgot-password — email OTP (self-serve)
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password-with-otp — { email, otp, password }
router.post("/reset-password-with-otp", resetPasswordWithOtp);

// POST /api/auth/reset-password — link token (admin-triggered)
router.post("/reset-password", resetPassword);

module.exports = router;

