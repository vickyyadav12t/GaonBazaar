const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/payment.controller");

router.post("/create-order", auth, createPaymentOrder);
router.post("/verify", auth, verifyPayment);

module.exports = router;
