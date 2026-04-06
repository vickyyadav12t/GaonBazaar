const express = require("express");
const { getLandingStats } = require("../controllers/public.controller");

const router = express.Router();

router.get("/landing-stats", getLandingStats);

module.exports = router;
