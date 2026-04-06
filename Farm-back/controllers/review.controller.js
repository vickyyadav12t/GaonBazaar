const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { createNotificationIfAllowed } = require("../utils/notificationDispatch");

const buildReviewResponse = (review) => {
  if (!review) return null;
  const plain = review.toObject ? review.toObject() : review;
  return plain;
};

// GET /api/reviews
// Buyer: reviews they wrote; Farmer: reviews about them (approved only); Admin: all
exports.getReviews = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let filter;
    if (role === "buyer") {
      filter = { reviewer: userId };
    } else if (role === "farmer") {
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      filter = {
        target: userId,
        // Published only; $ne:false keeps legacy docs without the field visible
        isApproved: { $ne: false },
      };
    } else if (role === "admin") {
      filter = {};
    } else {
      return res.status(403).json({
        message: "You are not allowed to list reviews for this account.",
      });
    }

    const reviews = await Review.find(filter)
      .populate("product", "name")
      .populate("reviewer", "name")
      .populate("target", "name")
      .sort({ createdAt: -1 });

    return res.json({
      reviews: reviews.map(buildReviewResponse),
    });
  } catch (err) {
    console.error("Get reviews error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching reviews",
    });
  }
};

// POST /api/reviews
// Buyer creates review for delivered order
exports.createReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== "buyer") {
      return res
        .status(403)
        .json({ message: "Only buyers can create reviews" });
    }

    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || !comment) {
      return res
        .status(400)
        .json({ message: "orderId, rating and comment are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    if (order.buyer.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You cannot review this order" });
    }

    if (order.status !== "delivered") {
      return res
        .status(400)
        .json({ message: "You can only review delivered orders" });
    }

    // Ensure only one review per order
    const existing = await Review.findOne({ order: order._id, reviewer: userId });
    if (existing) {
      return res.status(400).json({ message: "You already reviewed this order" });
    }

    const firstItem = order.items[0];

    const review = new Review({
      order: order._id,
      product: firstItem.product,
      reviewer: userId,
      target: order.farmer,
      rating,
      comment,
      isApproved: false,
    });

    await review.save();

    try {
      const [productDoc, buyerDoc, admins] = await Promise.all([
        Product.findById(firstItem.product).select("name").lean(),
        User.findById(userId).select("name").lean(),
        User.find({ role: "admin" }).select("_id").lean(),
      ]);
      const buyerName = buyerDoc?.name || "A buyer";
      const productName = productDoc?.name || "a product";
      const r = Math.min(5, Math.max(1, Number(rating)));
      await Promise.all(
        admins.map((admin) =>
          Notification.create({
            user: admin._id,
            type: "review",
            title: "Review pending moderation",
            message: `${buyerName} submitted a ${r}/5 review for ${productName}. Approve it in Admin → Reviews.`,
            link: "/admin/reviews",
          })
        )
      );
    } catch {
      // ignore notification errors
    }

    return res.status(201).json({ review: buildReviewResponse(review) });
  } catch (err) {
    console.error("Create review error:", err);
    return res.status(500).json({
      message: err.message || "Server error while creating review",
    });
  }
};

// PUT /api/reviews/:id/reply
// Farmer replies to review about them
exports.replyToReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;
    const { reply } = req.body;

    if (role !== "farmer" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only farmers or admins can reply to reviews" });
    }

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (role !== "admin" && review.target.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You cannot reply to this review" });
    }

    if (role === "farmer" && !review.isApproved) {
      return res.status(400).json({
        message: "You can only reply after the review is approved by a moderator",
      });
    }

    review.reply = reply;
    review.replyDate = new Date();
    await review.save();

    // Notify reviewer (buyer) about reply
    try {
      await createNotificationIfAllowed(Notification, {
        userId: review.reviewer,
        type: "review",
        title: "Response to your review",
        message: "The farmer has replied to your review.",
        link: "/buyer/reviews",
      });
    } catch {
      // ignore notification errors
    }

    return res.json({ review: buildReviewResponse(review) });
  } catch (err) {
    console.error("Reply to review error:", err);
    return res.status(500).json({
      message: err.message || "Server error while replying to review",
    });
  }
};

