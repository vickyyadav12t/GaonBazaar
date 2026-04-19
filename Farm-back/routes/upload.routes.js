const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const auth = require("../middleware/auth");
const { isAllowedImageMime, isAllowedKycMime } = require("../utils/allowedUploadMimes");
const {
  finalizeUploadBuffer,
  mapUploadErrorToHttp,
} = require("../utils/uploadFinalize");
const {
  isCloudinaryEnabled,
  uploadImageBuffer,
  uploadKycBuffer,
} = require("../services/cloudinaryUpload");
const { getUploadResponseBaseUrl } = require("../utils/publicAssetUrl");
const {
  MIME_JPEG,
  MIME_PNG,
  MIME_WEBP,
  MIME_GIF,
  MIME_PDF,
} = require("../utils/validateUploadedFile");

const router = express.Router();

function requireFarmerOrAdmin(req, res, next) {
  const role = req.user?.role;
  if (role !== "farmer" && role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}

function requireFarmer(req, res, next) {
  if (req.user?.role !== "farmer") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}

const uploadDir = path.join(__dirname, "..", "uploads", "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const kycDir = path.join(__dirname, "..", "uploads", "kyc");
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

const imageFileFilter = (_req, file, cb) => {
  if (isAllowedImageMime(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Only JPEG, PNG, WebP, or GIF are allowed (SVG and other types are blocked).")
  );
};

const kycFileFilter = (_req, file, cb) => {
  if (isAllowedKycMime(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Only JPEG, PNG, WebP, GIF, or PDF are allowed for KYC (SVG not allowed).")
  );
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    files: 5,
    fileSize: 2 * 1024 * 1024,
  },
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    files: 1,
    fileSize: 2 * 1024 * 1024,
  },
});

const kycUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: kycFileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});

function extForMime(mime) {
  const m = String(mime || "");
  if (m === MIME_JPEG) return ".jpg";
  if (m === MIME_PNG) return ".png";
  if (m === MIME_WEBP) return ".webp";
  if (m === MIME_GIF) return ".gif";
  if (m === MIME_PDF) return ".pdf";
  return "";
}

async function persistImageToDisk(buffer, mime) {
  const ext = extForMime(mime) || ".bin";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const destPath = path.join(uploadDir, filename);
  await fs.promises.writeFile(destPath, buffer);
  return { filename };
}

async function persistKycToDisk(buffer, mime) {
  const ext = extForMime(mime) || ".bin";
  const filename = `kyc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const destPath = path.join(kycDir, filename);
  await fs.promises.writeFile(destPath, buffer);
  return { filename };
}

router.post("/kyc", auth, requireFarmer, kycUpload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "No file provided" });
    }
    const { mime } = await finalizeUploadBuffer(file.buffer, { allowPdf: true });
    let url;
    if (isCloudinaryEnabled()) {
      try {
        url = await uploadKycBuffer(file.buffer, mime);
      } catch {
        return res.status(502).json({ message: "File storage temporarily unavailable." });
      }
    } else {
      const { filename } = await persistKycToDisk(file.buffer, mime);
      const baseUrl = getUploadResponseBaseUrl(req);
      url = `${baseUrl}/uploads/kyc/${filename}`;
    }
    return res.status(201).json({
      url,
      originalName: file.originalname || "",
    });
  } catch (err) {
    const { status, message } = mapUploadErrorToHttp(err);
    if (status >= 500) console.error("Upload KYC file error:", err?.code || err?.message);
    return res.status(status).json({ message });
  }
});

router.post("/avatar", auth, avatarUpload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const { mime } = await finalizeUploadBuffer(file.buffer, { allowPdf: false });
    let url;
    if (isCloudinaryEnabled()) {
      try {
        url = await uploadImageBuffer(file.buffer, "avatars");
      } catch {
        return res.status(502).json({ message: "Image storage temporarily unavailable." });
      }
    } else {
      const { filename } = await persistImageToDisk(file.buffer, mime);
      const baseUrl = getUploadResponseBaseUrl(req);
      url = `${baseUrl}/uploads/images/${filename}`;
    }
    return res.status(201).json({ url });
  } catch (err) {
    const { status, message } = mapUploadErrorToHttp(err);
    if (status >= 500) console.error("Upload avatar error:", err?.code || err?.message);
    return res.status(status).json({ message });
  }
});

router.post("/images", auth, requireFarmerOrAdmin, upload.array("images", 5), async (req, res) => {
  try {
    const files = req.files || [];
    const list = Array.isArray(files) ? files : [];
    if (list.length === 0) {
      return res.status(400).json({
        message:
          'No image files received. Send multipart field name "images" (JPEG, PNG, WebP, or GIF, max 2MB each).',
      });
    }
    const urls = [];
    const baseUrl = getUploadResponseBaseUrl(req);
    const useCloud = isCloudinaryEnabled();
    for (const f of list) {
      if (!f.buffer) {
        return res.status(400).json({ message: "Invalid file payload." });
      }
      const { mime } = await finalizeUploadBuffer(f.buffer, { allowPdf: false });
      if (useCloud) {
        try {
          urls.push(await uploadImageBuffer(f.buffer, "listings"));
        } catch {
          return res.status(502).json({ message: "Image storage temporarily unavailable." });
        }
      } else {
        const { filename } = await persistImageToDisk(f.buffer, mime);
        urls.push(`${baseUrl}/uploads/images/${filename}`);
      }
    }
    return res.status(201).json({ urls });
  } catch (err) {
    const { status, message } = mapUploadErrorToHttp(err);
    if (status >= 500) console.error("Upload images error:", err?.code || err?.message);
    return res.status(status).json({ message });
  }
});

router.use((err, _req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ message: "File exceeds size limit (images/avatar: 2MB, KYC: 5MB)" });
  }
  if (err?.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ message: "You can upload up to 5 images" });
  }
  return res.status(400).json({ message: err?.message || "Invalid upload" });
});

module.exports = router;
