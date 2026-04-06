const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const auth = require("../middleware/auth");
const { isAllowedImageMime, isAllowedKycMime } = require("../utils/allowedUploadMimes");
const {
  finalizeUploadedFile,
  mapUploadErrorToHttp,
} = require("../utils/uploadFinalize");

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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (isAllowedImageMime(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Only JPEG, PNG, WebP, or GIF are allowed (SVG and other types are blocked).")
  );
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    files: 5,
    fileSize: 2 * 1024 * 1024,
  },
});

const avatarUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    files: 1,
    fileSize: 2 * 1024 * 1024,
  },
});

const kycDir = path.join(__dirname, "..", "uploads", "kyc");
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

const kycStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, kycDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `kyc-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const kycFileFilter = (_req, file, cb) => {
  if (isAllowedKycMime(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Only JPEG, PNG, WebP, GIF, or PDF are allowed for KYC (SVG not allowed).")
  );
};

const kycUpload = multer({
  storage: kycStorage,
  fileFilter: kycFileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/kyc", auth, requireFarmer, kycUpload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }
    await finalizeUploadedFile(file, { allowPdf: true });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/kyc/${file.filename}`;
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
    if (!file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    await finalizeUploadedFile(file, { allowPdf: false });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/images/${file.filename}`;
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
    for (const f of list) {
      await finalizeUploadedFile(f, { allowPdf: false });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = list.map((f) => `${baseUrl}/uploads/images/${f.filename}`);
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
