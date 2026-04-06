const fs = require("fs");

const MIME_JPEG = "image/jpeg";
const MIME_PNG = "image/png";
const MIME_WEBP = "image/webp";
const MIME_GIF = "image/gif";
const MIME_PDF = "application/pdf";

/**
 * Detect type from magic bytes (ignore client-supplied Content-Type after multer).
 * @param {Buffer} buf first bytes of file
 * @returns {string|null}
 */
function detectMimeFromBuffer(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return MIME_JPEG;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return MIME_PNG;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && (buf[3] === 0x38 || buf[3] === 0x39))
    return MIME_GIF;
  const riff = buf.toString("ascii", 0, 4);
  const webp = buf.toString("ascii", 8, 12);
  if (riff === "RIFF" && webp === "WEBP") return MIME_WEBP;
  if (buf.toString("ascii", 0, 4) === "%PDF") return MIME_PDF;
  return null;
}

/**
 * @param {string} absPath
 * @param {{ allowPdf?: boolean }} opts
 * @returns {Promise<{ mime: string }>}
 */
async function assertFileContentAllowed(absPath, opts = {}) {
  const allowPdf = opts.allowPdf === true;
  const buf = Buffer.alloc(512);
  const fd = await fs.promises.open(absPath, "r");
  try {
    const { bytesRead } = await fd.read(buf, 0, 512, 0);
    const slice = buf.subarray(0, bytesRead);
    const mime = detectMimeFromBuffer(slice);
    if (!mime) {
      throw new Error("FILE_SIGNATURE_INVALID");
    }
    if (mime === MIME_PDF && !allowPdf) {
      throw new Error("FILE_PDF_NOT_ALLOWED");
    }
    if (mime !== MIME_PDF && !String(mime).startsWith("image/")) {
      throw new Error("FILE_TYPE_NOT_ALLOWED");
    }
    return { mime };
  } finally {
    await fd.close();
  }
}

async function unlinkQuiet(p) {
  try {
    await fs.promises.unlink(p);
  } catch {
    /* ignore */
  }
}

module.exports = {
  assertFileContentAllowed,
  unlinkQuiet,
  MIME_JPEG,
  MIME_PNG,
  MIME_WEBP,
  MIME_GIF,
  MIME_PDF,
};
