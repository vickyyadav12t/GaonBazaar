const Notification = require("../models/Notification");

// Helper to map to frontend shape
const buildNotificationResponse = (notif) => {
  if (!notif) return null;
  const plain = notif.toObject ? notif.toObject() : notif;
  return {
    id: String(plain._id),
    userId: String(plain.user),
    type: plain.type,
    title: plain.title,
    message: plain.message,
    link: plain.link,
    isRead: plain.isRead,
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : new Date().toISOString(),
  };
};

const NOTIF_LIST_MAX_LIMIT = 100;
const NOTIF_LIST_DEFAULT_LIMIT = 40;

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await Notification.countDocuments({ user: userId, isRead: false });
    return res.json({ unreadCount: count });
  } catch (err) {
    console.error("Get unread count error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching unread count",
    });
  }
};

// GET /api/notifications?limit=&skip=&includeTotal=true&type=
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type } = req.query;

    const filter = { user: userId };
    if (type) {
      filter.type = type;
    }

    const limitNum = Math.min(
      NOTIF_LIST_MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || NOTIF_LIST_DEFAULT_LIMIT)
    );
    const skipNum = Math.max(0, Number(req.query.skip) || 0);
    let total;
    if (String(req.query.includeTotal || "").toLowerCase() === "true") {
      total = await Notification.countDocuments(filter);
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.json({
      notifications: notifications.map(buildNotificationResponse),
      ...(typeof total === "number" ? { total } : {}),
      skip: skipNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching notifications",
    });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification: buildNotificationResponse(notif) });
  } catch (err) {
    console.error("Mark notification read error:", err);
    return res.status(500).json({
      message: err.message || "Server error while updating notification",
    });
  }
};

// POST /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

    return res.json({ success: true });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    return res.status(500).json({
      message: err.message || "Server error while updating notifications",
    });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const notif = await Notification.findOneAndDelete({ _id: id, user: userId });
    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete notification error:", err);
    return res.status(500).json({
      message: err.message || "Server error while deleting notification",
    });
  }
};

// DELETE /api/notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    await Notification.deleteMany({ user: userId });
    return res.json({ success: true });
  } catch (err) {
    console.error("Clear notifications error:", err);
    return res.status(500).json({
      message: err.message || "Server error while clearing notifications",
    });
  }
};

