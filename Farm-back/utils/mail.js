const nodemailer = require("nodemailer");

function isMailConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || opts.text.replace(/\n/g, "<br/>"),
  });
}

module.exports = { sendMail, isMailConfigured };
