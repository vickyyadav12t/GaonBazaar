const express = require("express");
const auth = require("../middleware/auth");
const earningsController = require("../controllers/earnings.controller");

const router = express.Router();

router.use(auth);
router.get("/", earningsController.getEarnings);
router.get("/withdrawals/export.csv", earningsController.exportFarmerWithdrawalsCsv);
router.post("/withdrawals", earningsController.createWithdrawal);

module.exports = router;
