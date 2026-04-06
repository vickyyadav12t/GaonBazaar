const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const notificationController = require("../controllers/notification.controller");

// All notification routes require authentication
router.use(auth);

router.get("/unread-count", notificationController.getUnreadCount);
router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/mark-all-read", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);
router.delete("/", notificationController.clearAllNotifications);

module.exports = router;

