const express = require("express");
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const requireFarmer = require("../middleware/requireFarmer");
const requireBuyerOrFarmer = require("../middleware/requireBuyerOrFarmer");
const attachFairDealChat = require("../middleware/attachFairDealChat");
const {
  listingCoach,
  fairDealCoach,
  helpChat,
  farmerNews,
  copilot,
} = require("../controllers/ai.controller");

const router = express.Router();

const listingCoachLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_LISTING_COACH_MAX_PER_HOUR) || 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? String(req.user.id) : req.ip || "anon"),
  message: { message: "Too many AI requests. Try again in an hour." },
});

const fairDealCoachLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_FAIR_DEAL_MAX_PER_HOUR) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? String(req.user.id) : req.ip || "anon"),
  message: { message: "Too many fair deal helper requests. Try again in an hour." },
});

const helpChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_HELP_CHAT_MAX_PER_HOUR) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id ? `help-chat:user:${req.user.id}` : `help-chat:ip:${req.ip || "anon"}`,
  message: { message: "Too many help chat messages. Try again in an hour." },
});

const farmerNewsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_FARMER_NEWS_MAX_PER_HOUR) || 24,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? `farmer-news:${req.user.id}` : req.ip || "anon"),
  message: { message: "Too many farmer news requests. Try again later." },
});

const copilotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_COPILOT_MAX_PER_HOUR) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.id ? `copilot:${req.user.id}` : req.ip || "anon"),
  message: { message: "Too many Copilot messages. Try again in a little while." },
});

router.post(
  "/listing-coach",
  auth,
  requireFarmer,
  listingCoachLimiter,
  listingCoach
);

router.post(
  "/fair-deal-coach",
  auth,
  requireBuyerOrFarmer,
  fairDealCoachLimiter,
  attachFairDealChat,
  fairDealCoach
);

router.post("/help-chat", optionalAuth, helpChatLimiter, helpChat);

router.post(
  "/farmer-news",
  auth,
  requireFarmer,
  farmerNewsLimiter,
  farmerNews
);

router.post(
  "/copilot",
  auth,
  requireBuyerOrFarmer,
  copilotLimiter,
  copilot
);

module.exports = router;
