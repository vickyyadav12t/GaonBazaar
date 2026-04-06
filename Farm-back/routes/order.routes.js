const express = require("express");
const auth = require("../middleware/auth");
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  exportOrdersCsv,
} = require("../controllers/order.controller");

const router = express.Router();

// All order routes are protected
router.get("/export.csv", auth, exportOrdersCsv);
router.get("/", auth, getOrders);
router.get("/:id", auth, getOrderById);
router.post("/", auth, createOrder);
router.put("/:id", auth, updateOrder);
router.post("/:id/cancel", auth, cancelOrder);

module.exports = router;

