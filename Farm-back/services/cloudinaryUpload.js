/**
 * Optional Cloudinary uploads — when CLOUDINARY_* env vars are set, listing/avatar/KYC
 * use Cloudinary instead of local disk (better for Render/serverless).
 */

const cloudinary = require("cloudinary").v2;
const { MIME_PDF } = require("../utils/validateUploadedFile");

function trimEnv(s) {
  return String(s || "").trim();
}

function isCloudinaryEnabled() {
  return Boolean(
    trimEnv(process.env.CLOUDINARY_CLOUD_NAME) &&
      trimEnv(process.env.CLOUDINARY_API_KEY) &&
      trimEnv(process.env.CLOUDINARY_API_SECRET)
  );
}

function baseFolder() {
  const f = trimEnv(process.env.CLOUDINARY_FOLDER);
  return f || "gaonbazaar";
}

let configured = false;
function ensureConfigured() {
  if (!isCloudinaryEnabled()) {
    const err = new Error("CLOUDINARY_NOT_CONFIGURED");
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: trimEnv(process.env.CLOUDINARY_CLOUD_NAME),
      api_key: trimEnv(process.env.CLOUDINARY_API_KEY),
      api_secret: trimEnv(process.env.CLOUDINARY_API_SECRET),
      secure: true,
    });
    configured = true;
  }
}

/**
 * @param {Buffer} buffer
 * @param {string} subfolder e.g. "listings" | "avatars"
 * @returns {Promise<string>} secure_url
 */
function uploadImageBuffer(buffer, subfolder) {
  ensureConfigured();
  const folder = `${baseFolder()}/${String(subfolder || "misc").replace(/^\/+|\/+$/g, "")}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err) {
          console.error("Cloudinary image upload:", err?.http_code || err?.message || err);
          reject(err);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

/**
 * KYC: image or PDF (raw).
 * @param {Buffer} buffer
 * @param {string} detectedMime from magic-byte check (not client Content-Type)
 * @returns {Promise<string>} secure_url
 */
function uploadKycBuffer(buffer, detectedMime) {
  ensureConfigured();
  const folder = `${baseFolder()}/kyc`;
  const isPdf = String(detectedMime || "") === MIME_PDF;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? "raw" : "image",
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err) {
          console.error("Cloudinary KYC upload:", err?.http_code || err?.message || err);
          reject(err);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

module.exports = {
  isCloudinaryEnabled,
  uploadImageBuffer,
  uploadKycBuffer,
};
