/**
 * Avoid logging query strings (tokens), full paths with PII-heavy segments, etc.
 */

function redactUrlForLog(originalUrl) {
  if (!originalUrl || typeof originalUrl !== "string") return "";
  const q = originalUrl.indexOf("?");
  const pathOnly = q === -1 ? originalUrl : originalUrl.slice(0, q);
  // Collapse long numeric IDs in logs (keep last 6 chars for correlation)
  return pathOnly.replace(/\/[0-9a-f]{24}\b/gi, "/…id");
}

function redactUserIdForLog(id) {
  if (id == null) return "";
  const s = String(id);
  if (s.length <= 6) return "…";
  return `…${s.slice(-6)}`;
}

module.exports = { redactUrlForLog, redactUserIdForLog };
