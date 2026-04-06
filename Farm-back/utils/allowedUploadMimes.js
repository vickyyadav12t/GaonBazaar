/** Client-declared MIME allowlist (still verified with magic bytes after save). SVG excluded (scriptable). */

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isAllowedImageMime(m) {
  return Boolean(m && ALLOWED_IMAGE_MIMES.has(String(m)));
}

function isAllowedKycMime(m) {
  return isAllowedImageMime(m) || String(m) === "application/pdf";
}

module.exports = { ALLOWED_IMAGE_MIMES, isAllowedImageMime, isAllowedKycMime };
