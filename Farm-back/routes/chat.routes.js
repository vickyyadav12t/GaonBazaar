const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const chatController = require("../controllers/chat.controller");

// All chat routes require authentication
router.use(auth);

router.get("/", chatController.getChats);
router.get("/:id", chatController.getChatById);
router.get("/:id/messages", chatController.getMessages);
router.post("/", chatController.createChat);
router.post("/:id/messages", chatController.sendMessage);

module.exports = router;

