/**
 * Strip high-risk PII patterns before sending user text to external LLM APIs.
 * Not a compliance guarantee — reduces accidental card / ID leakage.
 */

const CARD_LIKE =
  /\b(?:\d[ \-]*?){15,19}\b|\b\d{4}[ \-]?\d{4}[ \-]?\d{4}[ \-]?\d{4}\b/g;
const LONG_DIGIT_RUN = /\b\d{12,16}\b/g;
const UPI_OR_ACCOUNT_LINE =
  /^\s*(?:upi|vpa|account|a\/c|ifsc|iban)\s*[:#]?\s*.+$/gim;

/**
 * @param {string} text
 * @param {number} maxLen
 */
function sanitizeUserTextForAi(text, maxLen = 8000) {
  let t = String(text ?? "")
    .slice(0, maxLen)
    .replace(CARD_LIKE, "[redacted]")
    .replace(LONG_DIGIT_RUN, "[redacted]")
    .replace(UPI_OR_ACCOUNT_LINE, "[redacted line]");
  // Very long “address blocks” (multiple commas / pincode-looking tail)
  t = t.replace(
    /(?:[0-9]{1,3}[^,\n]{0,40},){3,}[0-9]{1,3}[^,\n]{0,80}/g,
    "[redacted address-like text]"
  );
  return t.trim();
}

/**
 * @param {{ role: string; content: string }[]} messages
 * @param {number} maxPerMessage
 */
function sanitizeHelpChatMessages(messages, maxPerMessage = 2000) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: sanitizeUserTextForAi(m.content, maxPerMessage),
  }));
}

module.exports = { sanitizeUserTextForAi, sanitizeHelpChatMessages };
