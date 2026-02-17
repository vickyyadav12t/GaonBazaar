const Review = require("../models/Review");
const Order = require("../models/Order");

const buildReviewResponse = (review) => {
  if (!review) return null;
  const plain = review.toObject ? review.toObject() : review;
  return plain;
};

// GET /api/reviews
// Buyer: reviews they wrote; Farmer: reviews about them; Admin: all
exports.getReviews = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const filter = {};
    if (role === "buyer") {
      filter.reviewer = userId;
    } else if (role === "farmer") {
      filter.target = userId;
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
    });

    await review.save();

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

    review.reply = reply;
    review.replyDate = new Date();
    await review.save();

    return res.json({ review: buildReviewResponse(review) });
  } catch (err) {
    console.error("Reply to review error:", err);
    return res.status(500).json({
      message: err.message || "Server error while replying to review",
    });
  }
};

