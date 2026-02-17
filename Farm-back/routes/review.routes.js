const express = require("express");
const auth = require("../middleware/auth");
const {
  getReviews,
  createReview,
  replyToReview,
} = require("../controllers/review.controller");

const router = express.Router();

// Protected review routes
router.get("/", auth, getReviews);
router.post("/", auth, createReview);
router.put("/:id/reply", auth, replyToReview);

module.exports = router;

