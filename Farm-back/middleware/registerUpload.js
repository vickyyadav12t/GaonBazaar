const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { isAllowedKycMime } = require("../utils/allowedUploadMimes");
const {
  finalizeUploadedFile,
  mapUploadErrorToHttp,
} = require("../utils/uploadFinalize");

const kycDir = path.join(__dirname, "..", "uploads", "kyc");
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, kycDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `kyc-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (isAllowedKycMime(file.mimetype)) return cb(null, true);
  cb(
    new Error("Only JPEG, PNG, WebP, GIF, or PDF files are allowed for KYC (SVG not allowed).")
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single("kycFile");

/**
 * Parses multipart fields + optional kycFile for POST /auth/register.
 * JSON-only requests skip multer (buyer registration).
 */
function registerUploadMiddleware(req, res, next) {
  const ct = req.headers["content-type"] || "";
  if (!ct.includes("multipart/form-data")) {
    return next();
  }
  return upload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ message: "KYC file must be 5MB or smaller (JPEG, PNG, WebP, GIF, or PDF)." });
      }
      return res.status(400).json({
        message: err.message || "Invalid KYC file upload",
      });
    }
    if (!req.file) {
      return next();
    }
    try {
      await finalizeUploadedFile(req.file, { allowPdf: true });
      return next();
    } catch (e) {
      const { status, message } = mapUploadErrorToHttp(e);
      if (status >= 500) {
        console.error("register KYC upload finalize:", e?.code || e?.message);
      }
      return res.status(status).json({ message });
    }
  });
}

module.exports = { registerUploadMiddleware };
