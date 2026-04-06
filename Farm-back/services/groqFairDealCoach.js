/**
 * Groq helper: neutral rephrase, question ideas, term explanations — no price advice.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are GaonBazaar's "Fair deal helper" for buyer–farmer chat on a direct-trade marketplace.

STRICT RULES:
- NEVER suggest a specific price, counter-offer, discount percent, or "say ₹X".
- NEVER coach someone to "win", manipulate, pressure, or lie.
- NEVER guarantee quality, delivery, or legal outcomes.
- You MAY: rephrase text to sound calm and neutral; suggest informational questions (grade, condition, pickup/delivery, timing, documents); explain trade words simply in English and Hindi.

The user message will include Mode: rephrase | questions | explain_term

Always respond with ONLY valid JSON (no markdown) using this exact shape. Use null for fields that do not apply to the current mode.
{
  "neutralDraft": string | null,
  "notes": string | null (one short line on tone change, or null),
  "questions": string[] | null,
  "term": string | null,
  "simpleEnglish": string | null,
  "simpleHindi": string | null
}

Mode rephrase: fill neutralDraft (and optional notes). questions, term, simpleEnglish, simpleHindi = null.
Mode questions: fill questions (4–7 strings). Mix simple English and Hindi as Indian users expect. Topics may include: variety/grade, how stock is packed, pickup vs transport, when load can move, min quantity, who arranges transport, payment timing — never "offer ₹…". Other keys null.
Mode explain_term: fill term (echo cleaned), simpleEnglish, simpleHindi (short, plain). Other keys null.`;

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

function buildUserMessage(mode, role, product, draftText, term) {
  const p = product || {};
  const line = `Product (context only, do not recommend changing price): ${p.name}${p.nameHindi ? ` / ${p.nameHindi}` : ""}, category ${p.category}, listed ₹${p.price} per ${p.unit}, negotiable: ${p.isNegotiable}. Viewer role in chat: ${role}.`;

  if (mode === "rephrase") {
    return `Mode: rephrase\n${line}\n\nRewrite the draft below in a neutral, respectful tone. Keep the same intent; do not add new numbers, prices, or threats. If already neutral, return a lightly polished version.\n\nDraft:\n"""${draftText}"""`;
  }
  if (mode === "questions") {
    return `Mode: questions\n${line}\n\nGenerate neutral questions ${role === "buyer" ? "the buyer could ask the farmer" : "the farmer could ask the buyer"} to understand the deal better. No price suggestions.`;
  }
  if (mode === "explain_term") {
    return `Mode: explain_term\n${line}\n\nExplain this term simply for a small farmer or buyer:\n"""${term}"""`;
  }
  return "";
}

/**
 * @param {{ mode: string, role: string, product: object, draftText?: string, term?: string }} args
 */
async function runFairDealCoach({ mode, role, product, draftText, term }) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured");
    err.code = "GROQ_NOT_CONFIGURED";
    throw err;
  }

  const model =
    String(process.env.GROQ_MODEL || "").trim() || "llama-3.3-70b-versatile";

  const userContent = buildUserMessage(mode, role, product, draftText, term);
  if (!userContent) {
    const err = new Error("Invalid mode");
    err.code = "INVALID_MODE";
    throw err;
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: 900,
      response_format: { type: "json_object" },
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error(`Groq returned non-JSON (${res.status})`);
    err.code = "GROQ_BAD_RESPONSE";
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const msg =
      data?.error?.message || data?.message || text.slice(0, 200) || "Groq error";
    const err = new Error(msg);
    err.code = "GROQ_HTTP_ERROR";
    err.status = res.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  const parsed = extractJsonObject(
    typeof content === "string" ? content : JSON.stringify(content ?? "")
  );
  if (!parsed || typeof parsed !== "object") {
    const err = new Error("Could not parse fair deal JSON from model");
    err.code = "GROQ_PARSE_ERROR";
    throw err;
  }

  if (mode === "rephrase") {
    const neutralDraft = String(parsed.neutralDraft || "").trim();
    if (!neutralDraft) {
      const err = new Error("Model returned empty rephrase");
      err.code = "GROQ_PARSE_ERROR";
      throw err;
    }
    return {
      mode: "rephrase",
      neutralDraft: neutralDraft.slice(0, 2000),
      notes: parsed.notes != null ? String(parsed.notes).trim().slice(0, 300) : null,
    };
  }

  if (mode === "questions") {
    const arr = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions = arr
      .map((q) => String(q || "").trim())
      .filter(Boolean)
      .slice(0, 10);
    if (!questions.length) {
      const err = new Error("Model returned no questions");
      err.code = "GROQ_PARSE_ERROR";
      throw err;
    }
    return { mode: "questions", questions };
  }

  if (mode === "explain_term") {
    const simpleEnglish = String(parsed.simpleEnglish || "").trim();
    const simpleHindi = String(parsed.simpleHindi || "").trim();
    if (!simpleEnglish && !simpleHindi) {
      const err = new Error("Model returned empty explanation");
      err.code = "GROQ_PARSE_ERROR";
      throw err;
    }
    return {
      mode: "explain_term",
      term: String(parsed.term || term || "").trim().slice(0, 120),
      simpleEnglish: simpleEnglish.slice(0, 800),
      simpleHindi: simpleHindi.slice(0, 800),
    };
  }

  const err = new Error("Invalid mode");
  err.code = "INVALID_MODE";
  throw err;
}

module.exports = { runFairDealCoach };
