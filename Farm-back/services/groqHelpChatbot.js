/**
 * Site help assistant — Groq chat with grounded GaonBazaar facts only.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SITE_GUIDE = `
GaonBazaar (this app) is a direct marketplace connecting farmers and buyers in India.

Accounts:
- Users register as either farmer or buyer (role-specific flows).
- Farmers may complete KYC / verification to list produce.
- Login uses email or phone + password; Google sign-in may be available.

For farmers:
- Create and manage product listings (name, description, price per unit, quantity, photos, organic flag, negotiable price toggle).
- A "listing coach" AI can suggest draft fields from rough notes (still review before publish).
- Receive buyer inquiries; negotiate in chat with buyers when price is negotiable.
- Track orders and earnings from the farmer dashboard.

For buyers:
- Browse marketplace, search/filter products, wishlist, cart.
- Place orders and pay via Razorpay (UPI, cards, netbanking) where enabled; other payment options depend on what the platform configured.
- Track orders from buyer dashboard; notifications may inform status changes.
- "Fair deal helper" AI can rephrase messages or suggest neutral questions in buyer–farmer chat (it does not set prices).

General:
- Crop calendar page shows seasonal crop guidance for Indian zones (reference only, not weather or mandi rates).
- Support: users can open support tickets from the Support page for account, payment, or order issues.
- Do not tell users exact phone numbers or emails unless they appear in this guide — you may say "use the Support page in the app" or "check your order screen".

Out of scope (refuse briefly and redirect to Support or a professional):
- Weather, MSP/mandi prices, government schemes, legal advice, medical or pesticide advice, guaranteed delivery times, or anything not listed above.
`.trim();

function buildSystemPrompt(lang) {
  const langRule =
    lang === "hi"
      ? 'Write the JSON "reply" field in simple Hindi (Hinglish is OK if the user mixed English).'
      : 'Write the JSON "reply" field in clear English (light Hinglish only if the user wrote mostly Hinglish).';

  return `You are GaonBazaar's in-app "Help" chat assistant.

RULES:
- Answer ONLY using the SITE_GUIDE below plus normal clarification of what the app is for. If the user asks for something not covered, say you don't have that detail and suggest Support in the app or the relevant dashboard screen (Orders, Listings, etc.).
- Be concise (2–6 short paragraphs or bullet lines max). Friendly, practical tone.
- Never invent features, phone numbers, guarantees, or prices. Never give farming/agronomy, weather, or investment advice.
- Never ask for passwords, OTPs, or full card numbers.
- ${langRule}
- Output ONLY valid JSON (no markdown): { "reply": string }

SITE_GUIDE:
"""
${SITE_GUIDE}
"""
`;
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * @param {{ messages: { role: string; content: string }[], lang: 'en'|'hi' }} p
 * @returns {Promise<{ reply: string }>}
 */
async function runHelpChatbot(p) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured");
    err.code = "GROQ_NOT_CONFIGURED";
    throw err;
  }

  const model =
    String(process.env.GROQ_MODEL || "").trim() || "llama-3.3-70b-versatile";

  const lang = p.lang === "hi" ? "hi" : "en";

  const groqMessages = [
    { role: "system", content: buildSystemPrompt(lang) },
    ...p.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    })),
  ];

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 700,
      messages: groqMessages,
    }),
  });

  if (!res.ok) {
    const err = new Error(`Groq HTTP ${res.status}`);
    err.code = "GROQ_HTTP_ERROR";
    err.status = res.status;
    try {
      err.message = `${err.message} ${await res.text()}`;
    } catch {
      /* ignore */
    }
    throw err;
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    const err = new Error("Empty Groq response");
    err.code = "GROQ_BAD_RESPONSE";
    throw err;
  }

  const parsed = extractJsonObject(raw);
  const reply = parsed && typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  if (!reply) {
    const err = new Error("Could not parse help reply JSON");
    err.code = "GROQ_PARSE_ERROR";
    throw err;
  }

  return { reply: reply.slice(0, 8000) };
}

module.exports = { runHelpChatbot };
