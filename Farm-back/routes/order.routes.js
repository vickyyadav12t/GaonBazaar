const express = require("express");
const auth = require("../middleware/auth");
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  exportOrdersCsv,
  requestOrderReturn,
  respondOrderReturn,
  confirmCodReturnRefunded,
} = require("../controllers/order.controller");

const router = express.Router();

// All order routes are protected
router.get("/export.csv", auth, exportOrdersCsv);
router.get("/", auth, getOrders);
router.post("/:id/return-request", auth, requestOrderReturn);
router.post("/:id/return-respond", auth, respondOrderReturn);
router.post("/:id/return-cod-refunded", auth, confirmCodReturnRefunded);
router.get("/:id", auth, getOrderById);
router.post("/", auth, createOrder);
router.put("/:id", auth, updateOrder);
router.post("/:id/cancel", auth, cancelOrder);

module.exports = router;

