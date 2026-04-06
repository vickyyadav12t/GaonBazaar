const Review = require("../models/Review");
const Order = require("../models/Order");

/**
 * @param {import('mongoose').Types.ObjectId[]} farmerIds
 * @returns {Promise<Map<string, number | null>>}
 */
async function getFarmerAvgRatingMap(farmerIds) {
  const map = new Map();
  if (!farmerIds || farmerIds.length === 0) return map;
  const rows = await Review.aggregate([
    { $match: { target: { $in: farmerIds }, isApproved: true } },
    { $group: { _id: "$target", avgRating: { $avg: "$rating" } } },
  ]);
  for (const r of rows) {
    const v = r.avgRating;
    map.set(
      String(r._id),
      v != null ? Math.round(Number(v) * 10) / 10 : null
    );
  }
  return map;
}

/**
 * Enrich plain user objects (lean) with admin dashboard stats.
 * @param {Record<string, unknown>[]} users
 */
async function attachAdminUserStats(users) {
  if (!users || users.length === 0) return users;

  const farmerIds = users.filter((u) => u.role === "farmer").map((u) => u._id);
  const buyerIds = users.filter((u) => u.role === "buyer").map((u) => u._id);

  const ratingMap = new Map();
  const reviewCountMap = new Map();
  const salesMap = new Map();
  const buyerOrderMap = new Map();

  const tasks = [];

  if (farmerIds.length > 0) {
    tasks.push(
      Review.aggregate([
        { $match: { target: { $in: farmerIds }, isApproved: true } },
        {
          $group: {
            _id: "$target",
            avgRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]).then((rows) => {
        for (const r of rows) {
          const id = String(r._id);
          const v = r.avgRating;
          ratingMap.set(
            id,
            v != null ? Math.round(Number(v) * 10) / 10 : null
          );
          reviewCountMap.set(id, r.reviewCount || 0);
        }
      })
    );
    tasks.push(
      Order.aggregate([
        { $match: { farmer: { $in: farmerIds }, status: "delivered" } },
        { $group: { _id: "$farmer", deliveredOrderCount: { $sum: 1 } } },
      ]).then((rows) => {
        for (const r of rows) {
          salesMap.set(String(r._id), r.deliveredOrderCount || 0);
        }
      })
    );
  }

  if (buyerIds.length > 0) {
    tasks.push(
      Order.aggregate([
        { $match: { buyer: { $in: buyerIds } } },
        { $group: { _id: "$buyer", orderCount: { $sum: 1 } } },
      ]).then((rows) => {
        for (const r of rows) {
          buyerOrderMap.set(String(r._id), r.orderCount || 0);
        }
      })
    );
  }

  await Promise.all(tasks);

  return users.map((u) => {
    const o = { ...u };
    if (u.role === "farmer") {
      const id = String(u._id);
      o.reviewCount = reviewCountMap.get(id) ?? 0;
      o.avgRating = ratingMap.has(id) ? ratingMap.get(id) : null;
      o.deliveredOrderCount = salesMap.get(id) ?? 0;
    } else if (u.role === "buyer") {
      o.orderCount = buyerOrderMap.get(String(u._id)) ?? 0;
    }
    return o;
  });
}

module.exports = { attachAdminUserStats, getFarmerAvgRatingMap };
