/**
 * Unified GaonBazaar AI Copilot — single model call with intent detection (JSON).
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SITE_GUIDE = `
GaonBazaar connects farmers and buyers in India. Farmers list produce; buyers browse, chat, cart, and order.
Payments may include Razorpay, COD, or bank transfer depending on listing. Orders have statuses (pending, processing, shipped, delivered, cancelled).
Farmers have listings, orders, earnings, chats, KYC. Buyers have cart, wishlist, orders, chats.
For account, payment disputes, or bugs: direct users to Support in the app and their dashboard — do not invent phone numbers.
`.trim();

const INTENT_ENUM = [
  "listing_improvement",
  "harvest_postharvest",
  "deal_summary",
  "product_buyer_qa",
  "order_explain",
  "general_help",
].join(" | ");

function stripMarkdownFences(text) {
  if (!text || typeof text !== "string") return "";
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "");
    s = s.replace(/\s*```\s*$/g, "");
  }
  return s.trim();
}

/**
 * Parse model JSON; use balanced braces so "reply" text containing `}` does not break parsing.
 */
function extractJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = stripMarkdownFences(text);
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < trimmed.length; i += 1) {
      const c = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\" && inString) {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === "{") depth += 1;
      if (c === "}") {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

function buildSystemPrompt(lang, userRole, context) {
  const langRule =
    lang === "hi"
      ? 'The "reply" field must be in simple Hindi (Hinglish OK if the user mixed languages).'
      : 'The "reply" field must be in clear English (light Hinglish only if natural).';

  const ctxBlock =
    context && typeof context === "object" && Object.keys(context).length > 0
      ? `\n\nPAGE_CONTEXT (trusted UI snapshot from the app; may be partial):\n${JSON.stringify(context).slice(0, 12000)}`
      : "";

  return `You are GaonBazaar's unified AI Copilot. The signed-in user role is: ${userRole} (farmer or buyer).

You handle ALL of the following in ONE assistant — detect intent from the user's message AND optional PAGE_CONTEXT JSON.

INTENTS (set "intent" to exactly one):
- listing_improvement — help improve titles, descriptions, categories, units, honesty, photos guidance (text only).
- harvest_postharvest — harvest timing, sorting, grading, storage hygiene, transport tips; generic extension-style guidance.
- deal_summary — summarise negotiation/chat fairly using ONLY chat excerpt in context when present.
- product_buyer_qa — suggested questions, quality checks, what to clarify with farmer; use ONLY product fields in context when present.
- order_explain — explain order status/payment lines in plain language using ONLY order summary in context when present.
- general_help — how to use GaonBazaar, dashboards, payments at a high level (use SITE_GUIDE).

OUTPUT RULES:
- Output ONLY valid JSON (no markdown fences). Shape: { "intent": "<one intent id>", "reply": "<string>" }
- "intent" must be exactly one of: ${INTENT_ENUM}
- "reply": concise (max ~900 words), practical, bullet-friendly newlines allowed. No markdown headings. Escape any double-quotes inside "reply" as \\" in JSON.
- ${langRule}

SAFETY:
- Never invent government scheme amounts, MSP, mandi prices, dates, or legal outcomes.
- No pesticide/chemical prescriptions, medical advice, or guaranteed weather/yield.
- No passwords, OTPs, card numbers. Redact if user pastes them.
- You do NOT browse URLs. If context is missing for a specialised task, say what you need or give safe general guidance and suggest opening the relevant screen.

SITE_GUIDE:
"""
${SITE_GUIDE}
"""
${ctxBlock}`;
}

/**
 * @param {{ messages: { role: string, content: string }[], lang: 'en'|'hi', userRole: string, context: object|null }} p
 * @returns {Promise<{ intent: string, reply: string }>}
 */
async function runCopilot(p) {
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
    { role: "system", content: buildSystemPrompt(lang, p.userRole, p.context || null) },
    ...p.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 6000),
    })),
  ];

  const payload = {
    model,
    temperature: 0.3,
    max_tokens: 1600,
    messages: groqMessages,
  };
  if (String(process.env.GROQ_COPILOT_JSON_MODE || "1").trim() !== "0") {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    const usedJsonMode = payload.response_format != null;
    if (usedJsonMode && res.status === 400) {
      console.warn(
        "groqCopilot: retrying without response_format (set GROQ_COPILOT_JSON_MODE=0 to skip json_object)."
      );
      const res2 = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 1600,
          messages: groqMessages,
        }),
      });
      if (!res2.ok) {
        const t2 = await res2.text();
        const err2 = new Error(`Groq HTTP ${res2.status}`);
        err2.code = "GROQ_HTTP_ERROR";
        err2.status = res2.status;
        err2.message = `${err2.message} ${t2}`;
        console.error("groqCopilot Groq error:", err2.message.slice(0, 800));
        throw err2;
      }
      const data2 = await res2.json();
      return finishCopilotParse(data2);
    }
    const err = new Error(`Groq HTTP ${res.status}`);
    err.code = "GROQ_HTTP_ERROR";
    err.status = res.status;
    err.message = `${err.message} ${bodyText}`;
    console.error("groqCopilot Groq error:", err.message.slice(0, 800));
    throw err;
  }

  const data = await res.json();
  return finishCopilotParse(data);
}

function finishCopilotParse(data) {
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    const err = new Error("Empty Groq response");
    err.code = "GROQ_BAD_RESPONSE";
    throw err;
  }

  const parsed = extractJsonObject(raw);
  let intent =
    parsed && typeof parsed.intent === "string"
      ? parsed.intent.trim().slice(0, 64)
      : "general_help";
  let reply =
    parsed && typeof parsed.reply === "string" ? parsed.reply.trim().slice(0, 12000) : "";

  if (!reply && typeof parsed?.reply === "number") {
    reply = String(parsed.reply).trim();
  }

  if (!reply) {
    console.error(
      "groqCopilot parse: missing reply. Raw (first 500 chars):",
      raw.slice(0, 500)
    );
    const err = new Error("Could not parse copilot JSON (missing reply)");
    err.code = "GROQ_PARSE_ERROR";
    throw err;
  }

  return { intent, reply };
}

module.exports = { runCopilot };
