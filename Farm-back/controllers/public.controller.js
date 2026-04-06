const User = require("../models/User");
const Product = require("../models/Product");
const { countLinkedOrders } = require("../utils/orderLinked");

const stockTestNameRe = /^StockTest\s+(Buyer\s+[AB]|Farmer)\b/i;
const nonStockTestUser = { name: { $not: stockTestNameRe } };

/** GET /api/public/landing-stats — anonymous counts for the marketing page (excludes stock-test users). */
exports.getLandingStats = async (_req, res) => {
  try {
    const [farmerCount, buyerCount, deliveredDeals, activeListings] = await Promise.all([
      User.countDocuments({ ...nonStockTestUser, role: "farmer" }),
      User.countDocuments({ ...nonStockTestUser, role: "buyer" }),
      countLinkedOrders({ status: "delivered" }),
      Product.countDocuments({ status: "active" }),
    ]);
    return res.json({
      farmerCount,
      buyerCount,
      deliveredDeals,
      activeListings,
    });
  } catch (err) {
    console.error("getLandingStats error:", err?.message);
    return res.status(500).json({ message: "Could not load public stats" });
  }
};
