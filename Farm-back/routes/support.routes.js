const express = require("express");
const optionalAuth = require("../middleware/optionalAuth");
const auth = require("../middleware/auth");
const supportController = require("../controllers/support.controller");

const router = express.Router();

// Support ticket submission (optional auth).
router.post("/tickets", optionalAuth, supportController.submitTicket);

// Authenticated: user's tickets (must be before /tickets/:id)
router.get("/tickets/my", auth, supportController.listMyTickets);
router.get("/tickets/:id", auth, supportController.getMyTicket);
router.post("/tickets/:id/reply", auth, supportController.userReplyToTicket);

// Newsletter subscribe (optional auth).
router.post("/newsletter/subscribe", optionalAuth, supportController.subscribeNewsletter);

module.exports = router;

