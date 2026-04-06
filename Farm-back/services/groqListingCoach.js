/**
 * Groq OpenAI-compatible chat completions for listing coach (farmer notes → structured JSON).
 * @see https://console.groq.com/docs/api
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const ALLOWED_CATEGORIES = new Set([
  "vegetables",
  "fruits",
  "grains",
  "pulses",
  "spices",
  "dairy",
  "other",
]);

const ALLOWED_UNITS = new Set(["kg", "quintal", "ton", "piece", "dozen"]);

const SYSTEM_PROMPT = `You are GaonBazaar's "Mandi-ready listing coach" for Indian farmers.
The listing form has: Product name (English + Hindi), Category, Description, Price (₹ per unit), Unit, Min order qty, Available quantity, Harvest date, Organic toggle, Price negotiable toggle. You cannot set images.

GOOD FARMER NOTES (encourage this in honestyHints when their note is thin) usually say, in simple words:
- कौन सी फसल / माल (what they are selling)
- कितना है और किस गिनती में (number + quintal/kg/ton/piece etc.)
- कहाँ से / किस इलाके से (place or mandi — goes in description; no separate address field)
- माल कैसा दिखता है — साफ, भरा, ताज़ा, बोरी वाला, etc. (plain language in description; do not use technical lab jargon unless they wrote it)
- कीमत साफ है या फोन/मुलाकात पर बात होगी

PHRASE → FIELDS:
- "rate baat" / "daam par baat" / "mol tol" / "negotiable" / "fix nahi" / "phone par batayenge" → isNegotiableGuess true; short honest line in description; honestyHints: "Price negotiable" switch on + optional indicative ₹ in Price field.
- "fixed rate" / "final rate" / "no bargain" → isNegotiableGuess false when clear.
- Place names → origin in description.
- Number + quintal/man/bori/kg/ton → match unit and suggestedAvailableQuantity.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "name": string (short English title, under 80 chars),
  "nameHindi": string (short Hindi title, empty if unclear),
  "description": string (2-5 sentences: crop, quantity context, place, quality in simple words, price talk if mentioned; honest),
  "category": one of vegetables|fruits|grains|pulses|spices|dairy|other,
  "unit": one of kg|quintal|ton|piece|dozen,
  "suggestedPrice": number or null,
  "suggestedAvailableQuantity": number or null,
  "suggestedMinOrderQuantity": number or null,
  "suggestedHarvestDate": string or null (YYYY-MM-DD only if inferable),
  "honestyHints": string[] (3-5 bullets). Simple Hinglish/English a farmer understands. Each ties to the form: e.g. "विवरण में माल की हालत अपने शब्दों में और लिखें", "'कीमत पर बातचीत' वाला बटन ऑन करें अगर रेट पर बात है", "उपलब्ध मात्रा और इकाई (क्विंटल/किलो) दोबारा देख लें", "कम से कम ऑर्डर भरें अगर छोटी बिक्री नहीं". No medical/chemical jargon.
  "isOrganicGuess": boolean,
  "isNegotiableGuess": boolean
}

Rules:
- Never invent schemes, MSP, or guaranteed prices.
- If price/qty unclear, use null.
- Gehu/wheat → grains; dal types → pulses.
- honestyHints must not push technical or English science words; keep tips in simple daily language. If the note is very short, use hints like "फसल का नाम और मात्रा लिखें", "जगह या मंडी का नाम जोड़ें", "माल कैसा है दो लाइन विवरण में लिखें".`;

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

function normalizeCoachPayload(raw) {
  if (!raw || typeof raw !== "object") return null;

  const category = ALLOWED_CATEGORIES.has(String(raw.category))
    ? String(raw.category)
    : "other";

  const unit = ALLOWED_UNITS.has(String(raw.unit)) ? String(raw.unit) : "kg";

  const name = String(raw.name || "")
    .trim()
    .slice(0, 200);
  const nameHindi = String(raw.nameHindi || "")
    .trim()
    .slice(0, 200);
  const description = String(raw.description || "")
    .trim()
    .slice(0, 5000);

  const hints = Array.isArray(raw.honestyHints)
    ? raw.honestyHints
        .map((h) => String(h || "").trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const numOrNull = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  let suggestedHarvestDate = null;
  if (raw.suggestedHarvestDate != null && raw.suggestedHarvestDate !== "") {
    const s = String(raw.suggestedHarvestDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) suggestedHarvestDate = s;
  }

  return {
    name: name || "Farm produce",
    nameHindi,
    description,
    category,
    unit,
    suggestedPrice: numOrNull(raw.suggestedPrice),
    suggestedAvailableQuantity: numOrNull(raw.suggestedAvailableQuantity),
    suggestedMinOrderQuantity: numOrNull(raw.suggestedMinOrderQuantity),
    suggestedHarvestDate,
    honestyHints: hints.length
      ? hints
      : [
          "विवरण में फसल, मात्रा, जगह और माल की हालत अपनी भाषा में साफ लिखें; कीमत (₹), इकाई और उपलब्ध मात्रा जाँच करें।",
        ],
    isOrganicGuess: Boolean(raw.isOrganicGuess),
    isNegotiableGuess: raw.isNegotiableGuess !== false,
  };
}

/**
 * @param {string} notes
 * @param {{ district?: string; state?: string }} [location]
 * @returns {Promise<object>}
 */
async function runListingCoach(notes, location = {}) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured");
    err.code = "GROQ_NOT_CONFIGURED";
    throw err;
  }

  const model =
    String(process.env.GROQ_MODEL || "").trim() || "llama-3.3-70b-versatile";

  const locParts = [location.district, location.state].filter(Boolean);
  const locLine =
    locParts.length > 0
      ? `\nFarmer location hint (from profile): ${locParts.join(", ")}.`
      : "";

  const userContent = `Farmer notes:\n"""${notes}"""${locLine}\n\nFill the listing JSON from these notes. Output JSON only.`;

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
      temperature: 0.35,
      max_tokens: 1200,
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
  if (!parsed) {
    const err = new Error("Could not parse listing coach JSON from model");
    err.code = "GROQ_PARSE_ERROR";
    throw err;
  }

  return normalizeCoachPayload(parsed);
}

module.exports = {
  runListingCoach,
  ALLOWED_CATEGORIES,
  ALLOWED_UNITS,
};
