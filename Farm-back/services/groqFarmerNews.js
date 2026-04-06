/**
 * Groq: farmer-focused snapshot from RSS headlines only (no article bodies).
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SNAPSHOT_CACHE_MS =
  Number(process.env.FARMER_NEWS_SNAPSHOT_MS) > 0
    ? Number(process.env.FARMER_NEWS_SNAPSHOT_MS)
    : 45 * 60 * 1000;

/** @type {Map<string, { at: number, bullets: string[], generatedAt: string }>} */
const snapshotCache = new Map();

/** Last successful snapshot per language (for fallback when Groq errors). */
/** @type {Map<string, { bullets: string[], generatedAt: string }>} */
const snapshotFallback = new Map();

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

function buildSnapshotSystemPrompt(lang) {
  const langRule =
    lang === "hi"
      ? "Write every bullet in simple Hindi (Hinglish is OK if headlines are mixed)."
      : "Write every bullet in clear, simple English.";

  return `You help Indian farmers scan recent NEWS HEADLINES.

RULES:
- You ONLY see headline text and outlet names. You did NOT read full articles.
- Output ONLY valid JSON (no markdown): { "bullets": string[] }
- Produce exactly 4 to 6 bullets. Each bullet max 220 characters.
- ${langRule}
- Summarise ONLY themes that reasonably appear in the headlines. Do NOT invent facts, numbers, dates, policy names, or events that are not implied by the headlines.
- If headlines are weakly related to farming, say so briefly and suggest farmers open stories that match their crops or region.
- Never say you read the article body.`;
}

/**
 * @param {{ lang: 'en'|'hi', articles: { title: string, source: string }[], refresh?: boolean }} p
 * @returns {Promise<{ bullets: string[], generatedAt: string | null, fromCache: boolean, skipped?: boolean }>}
 */
async function runFarmerNewsSnapshot(p) {
  const lang = p.lang === "hi" ? "hi" : "en";
  const refresh = !!p.refresh;
  const headlines = (p.articles || []).slice(0, 14).filter((a) => a && a.title);

  if (headlines.length === 0) {
    return { bullets: [], generatedAt: null, fromCache: false, skipped: true };
  }

  const cacheKey = lang;

  if (!refresh) {
    const hit = snapshotCache.get(cacheKey);
    if (hit && Date.now() - hit.at < SNAPSHOT_CACHE_MS) {
      return {
        bullets: hit.bullets,
        generatedAt: hit.generatedAt,
        fromCache: true,
      };
    }
  } else {
    snapshotCache.delete(cacheKey);
  }

  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured");
    err.code = "GROQ_NOT_CONFIGURED";
    throw err;
  }

  const model =
    String(process.env.GROQ_MODEL || "").trim() || "llama-3.3-70b-versatile";

  const block = headlines
    .map((a, i) => `${i + 1}. [${String(a.source || "News").slice(0, 80)}] ${String(a.title).slice(0, 280)}`)
    .join("\n");

  const userContent = `Headlines (outlet + title only):\n\n${block}\n\nReturn JSON with 4-6 bullets for farmers.`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: buildSnapshotSystemPrompt(lang) },
        { role: "user", content: userContent },
      ],
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
  const arr = parsed && Array.isArray(parsed.bullets) ? parsed.bullets : null;
  if (!arr || arr.length === 0) {
    const err = new Error("Could not parse snapshot JSON");
    err.code = "GROQ_PARSE_ERROR";
    throw err;
  }

  const bullets = arr
    .map((b) => String(b || "").trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 8);

  const generatedAt = new Date().toISOString();
  snapshotCache.set(cacheKey, { at: Date.now(), bullets, generatedAt });
  snapshotFallback.set(cacheKey, { bullets, generatedAt });

  return { bullets, generatedAt, fromCache: false };
}

function getLastSnapshotFallback(lang) {
  return snapshotFallback.get(lang === "hi" ? "hi" : "en") || null;
}

module.exports = {
  runFarmerNewsSnapshot,
  getLastSnapshotFallback,
};
