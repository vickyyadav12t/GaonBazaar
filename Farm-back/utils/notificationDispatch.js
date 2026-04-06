const User = require("../models/User");

const DEFAULT_PREFS = {
  emailNotifications: true,
  pushNotifications: true,
  orderUpdates: true,
  messageNotifications: true,
  reviewNotifications: true,
  promotionalEmails: false,
};

function prefsFromDoc(doc) {
  const raw = doc?.notificationPreferences;
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PREFS };
  }
  return { ...DEFAULT_PREFS, ...raw };
}

function allowsInAppType(prefs, type) {
  const t = String(type || "system");
  if (t === "order" || t === "payment") return !!prefs.orderUpdates;
  if (t === "message") return !!prefs.messageNotifications;
  if (t === "review") return !!prefs.reviewNotifications;
  return true;
}

async function loadPrefs(userId) {
  if (!userId) return { ...DEFAULT_PREFS };
  const u = await User.findById(userId).select("role notificationPreferences").lean();
  return prefsFromDoc(u);
}

/**
 * Creates an in-app notification if the recipient's preferences allow this type.
 * Admin recipients always receive operational notifications (no preference filter).
 */
async function createNotificationIfAllowed(Notification, { userId, type, title, message, link }) {
  if (!userId) return null;
  const u = await User.findById(userId).select("role notificationPreferences").lean();
  if (!u) return null;
  if (String(u.role) === "admin") {
    return Notification.create({ user: userId, type, title, message, link });
  }
  const prefs = prefsFromDoc(u);
  if (!allowsInAppType(prefs, type)) return null;
  return Notification.create({ user: userId, type, title, message, link });
}

module.exports = {
  DEFAULT_PREFS,
  prefsFromDoc,
  allowsInAppType,
  loadPrefs,
  createNotificationIfAllowed,
};
