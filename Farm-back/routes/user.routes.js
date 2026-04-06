const express = require("express");
const auth = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  submitKycDocument,
} = require("../controllers/user.controller");

const router = express.Router();

// All routes in this file are protected with JWT
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.post("/kyc", auth, submitKycDocument);

module.exports = router;

