const AuditLog = require("../models/AuditLog");

/**
 * Record an admin (or authenticated) action. Never throws — failures are logged only.
 * @param {import('express').Request} req
 * @param {{
 *   action: string;
 *   resourceType: string;
 *   resourceId: string;
 *   targetUserId?: import('mongoose').Types.ObjectId | string | null;
 *   details?: Record<string, unknown>;
 * }} payload
 */
function logAudit(req, payload) {
  const actorId = req.user?.id;
  if (!actorId) return;

  const doc = {
    actor: actorId,
    actorRole: req.user?.role,
    action: payload.action,
    resourceType: payload.resourceType,
    resourceId: String(payload.resourceId),
    details: payload.details && typeof payload.details === "object" ? payload.details : {},
  };
  if (payload.targetUserId) {
    doc.targetUserId = payload.targetUserId;
  }

  AuditLog.create(doc).catch((err) => {
    console.error("AuditLog create failed:", err?.message || err);
  });
}

module.exports = { logAudit };
