const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

/**
 * When UPLOAD_VIRUS_SCAN=1, run a CLI scanner (default: clamdscan) on the saved file.
 * Install ClamAV on the host and ensure the daemon/socket is configured.
 *
 * Env:
 *   UPLOAD_VIRUS_SCAN=1
 *   UPLOAD_CLAMDSCAN_CMD=clamdscan   (or full path)
 *   UPLOAD_CLAMDSCAN_TIMEOUT_MS=60000
 */
async function scanUploadedFileIfEnabled(absPath) {
  if (String(process.env.UPLOAD_VIRUS_SCAN || "").trim() !== "1") {
    return;
  }
  const cmd =
    String(process.env.UPLOAD_CLAMDSCAN_CMD || "").trim() || "clamdscan";
  const timeout = Math.min(
    120000,
    Math.max(5000, Number(process.env.UPLOAD_CLAMDSCAN_TIMEOUT_MS) || 60000)
  );

  try {
    await execFileAsync(cmd, ["--no-summary", absPath], {
      timeout,
      maxBuffer: 2 * 1024 * 1024,
    });
  } catch (err) {
    const code = err?.code;
    const msg = String(err?.message || err || "");
    if (code === "ENOENT") {
      const e = new Error("Virus scanner not available (command missing)");
      e.code = "SCANNER_NOT_CONFIGURED";
      throw e;
    }
    const e = new Error(
      `Upload rejected by virus scan${msg ? `: ${msg.slice(0, 200)}` : ""}`
    );
    e.code = "SCAN_FAILED_OR_INFECTED";
    throw e;
  }
}

module.exports = { scanUploadedFileIfEnabled };
