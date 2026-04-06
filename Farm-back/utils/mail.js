const nodemailer = require("nodemailer");
const dns = require("dns");

// Cloud hosts: avoid hanging on broken IPv6 routes to smtp.* (Render, etc.)
try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (_) {
  /* ignore */
}

function isMailConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

/** @type {import('nodemailer').Transporter | null} */
let cachedTransporter = null;

/** Drop cached connection after errors so the next send retries with a fresh socket. */
function resetMailTransporter() {
  cachedTransporter = null;
}

function buildTransportOptions() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";

  // Nodemailer default TCP connect wait is 120s; we had 30s and saw ETIMEDOUT on CONN from Render→Gmail.
  const connMs = Math.min(
    180000,
    Math.max(15000, Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 120000)
  );
  const greetMs = Math.min(120000, Math.max(10000, Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 60000));
  const sockMs = Math.min(300000, Math.max(30000, Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 120000));
  const dnsMs = Math.min(90000, Math.max(5000, Number(process.env.SMTP_DNS_TIMEOUT_MS) || 45000));

  const opts = {
    host: String(process.env.SMTP_HOST).trim(),
    port,
    secure,
    auth: {
      user: String(process.env.SMTP_USER).trim(),
      pass: String(process.env.SMTP_PASS),
    },
    connectionTimeout: connMs,
    greetingTimeout: greetMs,
    socketTimeout: sockMs,
    dnsTimeout: dnsMs,
  };

  // Optional: force TLS upgrade (some hosts need it; others reject it — default off).
  // Nodemailer still negotiates STARTTLS on 587 without this for most providers.
  if (
    String(process.env.SMTP_REQUIRE_TLS || "").trim() === "1" &&
    !secure &&
    (port === 587 || port === 2525)
  ) {
    opts.requireTLS = true;
  }

  // Dev only: self-signed SMTP (set SMTP_TLS_REJECT_UNAUTHORIZED=0)
  if (String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || "").trim() === "0") {
    opts.tls = { ...(opts.tls || {}), rejectUnauthorized: false };
  }

  return opts;
}

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport(buildTransportOptions());
  }
  return cachedTransporter;
}

/**
 * Call once on startup to surface bad credentials / firewall issues in logs.
 * @returns {Promise<boolean>}
 */
async function verifyMailConnection() {
  if (!isMailConfigured()) {
    return false;
  }
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.verify();
    console.log("[mail] SMTP connection verified OK");
    return true;
  } catch (err) {
    console.error(
      "[mail] SMTP verify failed — check SMTP_HOST, port, and credentials:",
      err?.message || err
    );
    return false;
  }
}

/**
 * @param {{ to: string; subject: string; text: string; html?: string }} opts
 */
async function sendMail(opts) {
  if (!isMailConfigured()) {
    const err = new Error("Email is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  const transporter = getTransporter();
  if (!transporter) {
    const err = new Error("Email transporter unavailable");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, "<br/>"),
    });
  } catch (err) {
    resetMailTransporter();
    const code = err.code || err.responseCode;
    console.error(
      `[mail] send failed (to=${String(opts.to).slice(0, 64)}…): ${err.message}${
        code != null ? ` [${code}]` : ""
      }`
    );
    if (code === "ETIMEDOUT" || String(err.command || "") === "CONN") {
      console.error(
        "[mail] hint: TCP to SMTP host timed out. On Render, confirm outbound 587/465 is allowed; try SMTP_PORT=465 + SMTP_SECURE=true (Gmail); or use SendGrid port 2525. See .env.example."
      );
    }
    throw err;
  }
}

module.exports = {
  sendMail,
  isMailConfigured,
  verifyMailConnection,
  resetMailTransporter,
};
