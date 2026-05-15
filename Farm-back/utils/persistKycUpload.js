const fs = require("fs");
const path = require("path");
const {
  isCloudinaryEnabled,
  uploadKycBuffer,
} = require("../services/cloudinaryUpload");
const { getUploadResponseBaseUrl } = require("./publicAssetUrl");
const {
  MIME_JPEG,
  MIME_PNG,
  MIME_WEBP,
  MIME_GIF,
  MIME_PDF,
} = require("./validateUploadedFile");

const kycDir = path.join(__dirname, "..", "uploads", "kyc");
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

function extForMime(mime) {
  const m = String(mime || "");
  if (m === MIME_JPEG) return ".jpg";
  if (m === MIME_PNG) return ".png";
  if (m === MIME_WEBP) return ".webp";
  if (m === MIME_GIF) return ".gif";
  if (m === MIME_PDF) return ".pdf";
  return "";
}

async function persistKycToDisk(buffer, mime) {
  const ext = extForMime(mime) || ".bin";
  const filename = `kyc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const destPath = path.join(kycDir, filename);
  await fs.promises.writeFile(destPath, buffer);
  return { filename, destPath };
}

/**
 * Store KYC buffer on Cloudinary when configured, else local disk under /uploads/kyc.
 * @returns {Promise<string>} public fileUrl
 */
async function persistKycUpload(buffer, mime, req) {
  if (isCloudinaryEnabled()) {
    return uploadKycBuffer(buffer, mime);
  }
  const { filename } = await persistKycToDisk(buffer, mime);
  const baseUrl = getUploadResponseBaseUrl(req);
  return `${baseUrl}/uploads/kyc/${filename}`;
}

/** Remove a local disk KYC file referenced by a /uploads/kyc/... URL (no-op for Cloudinary URLs). */
async function deleteLocalKycByUrl(fileUrl) {
  const u = String(fileUrl || "").trim();
  if (!u) return;
  if (/res\.cloudinary\.com/i.test(u)) return;
  let pathname;
  try {
    pathname = new URL(u).pathname;
  } catch {
    if (u.startsWith("/uploads/kyc/")) pathname = u;
    else return;
  }
  const prefix = "/uploads/kyc/";
  if (!pathname.startsWith(prefix)) return;
  const filename = path.basename(pathname);
  if (!filename || filename.includes("..")) return;
  const destPath = path.join(kycDir, filename);
  try {
    if (fs.existsSync(destPath)) await fs.promises.unlink(destPath);
  } catch (_) {}
}

module.exports = {
  persistKycUpload,
  deleteLocalKycByUrl,
};
