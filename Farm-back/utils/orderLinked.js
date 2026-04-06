const Order = require("../models/Order");

/**
 * Orders whose buyer and farmer ObjectIds still exist in users.
 * Excludes orphan rows left after user documents are removed from MongoDB.
 */
const LINKED_ORDER_STAGES = [
  { $lookup: { from: "users", localField: "buyer", foreignField: "_id", as: "_buyer" } },
  { $lookup: { from: "users", localField: "farmer", foreignField: "_id", as: "_farmer" } },
  { $match: { "_buyer.0": { $exists: true }, "_farmer.0": { $exists: true } } },
];

async function countLinkedOrders(match = {}) {
  const pipeline = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    ...LINKED_ORDER_STAGES,
    { $count: "n" },
  ];
  const [row] = await Order.aggregate(pipeline);
  return row?.n ?? 0;
}

/** Linked orders only; counts by fulfilment status (schema enum). */
async function countLinkedOrdersByStatus() {
  const pipeline = [...LINKED_ORDER_STAGES, { $group: { _id: "$status", count: { $sum: 1 } } }];
  const rows = await Order.aggregate(pipeline);
  const breakdown = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  let totalOrders = 0;
  for (const r of rows) {
    const c = Number(r.count) || 0;
    totalOrders += c;
    const key = r._id;
    if (key && Object.prototype.hasOwnProperty.call(breakdown, key)) {
      breakdown[key] = c;
    }
  }
  return { breakdown, totalOrders };
}

module.exports = { LINKED_ORDER_STAGES, countLinkedOrders, countLinkedOrdersByStatus };
