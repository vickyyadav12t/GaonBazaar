const { assertFileContentAllowed, unlinkQuiet } = require("./validateUploadedFile");
const { scanUploadedFileIfEnabled } = require("./uploadVirusScan");

/**
 * Verify magic bytes + optional ClamAV after multer wrote the file.
 * Deletes the file on failure.
 */
async function finalizeUploadedFile(file, { allowPdf }) {
  if (!file?.path) {
    const e = new Error("NO_FILE");
    e.code = "NO_FILE";
    throw e;
  }
  try {
    await assertFileContentAllowed(file.path, { allowPdf });
    await scanUploadedFileIfEnabled(file.path);
  } catch (e) {
    await unlinkQuiet(file.path);
    throw e;
  }
}

function mapUploadErrorToHttp(err) {
  const msg = String(err?.message || "");
  const code = err?.code || msg;

  if (code === "NO_FILE") {
    return { status: 400, message: "No file provided" };
  }
  if (
    msg === "FILE_SIGNATURE_INVALID" ||
    msg === "FILE_PDF_NOT_ALLOWED" ||
    msg === "FILE_TYPE_NOT_ALLOWED"
  ) {
    return {
      status: 400,
      message:
        "File content is not allowed (type mismatch, corrupted file, or unsupported format).",
    };
  }
  if (code === "SCANNER_NOT_CONFIGURED") {
    return {
      status: 503,
      message: "Virus scanning is enabled but the scanner command is not available on this server.",
    };
  }
  if (code === "SCAN_FAILED_OR_INFECTED") {
    return {
      status: 422,
      message: "Upload did not pass the security scan.",
    };
  }
  return { status: 500, message: "Upload processing failed" };
}

module.exports = { finalizeUploadedFile, mapUploadErrorToHttp };
