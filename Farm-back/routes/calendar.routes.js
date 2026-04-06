const express = require("express");
const router = express.Router();
const optionalAuth = require("../middleware/optionalAuth");
const calendarController = require("../controllers/calendar.controller");

router.get("/", calendarController.getPublicCalendar);
router.get("/farmer-context", optionalAuth, calendarController.getFarmerContext);

module.exports = router;
