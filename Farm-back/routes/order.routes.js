const express = require("express");
const auth = require("../middleware/auth");
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
} = require("../controllers/order.controller");

const router = express.Router();

// All order routes are protected
router.get("/", auth, getOrders);
router.get("/:id", auth, getOrderById);
router.post("/", auth, createOrder);
router.put("/:id", auth, updateOrder);
router.post("/:id/cancel", auth, cancelOrder);

module.exports = router;

