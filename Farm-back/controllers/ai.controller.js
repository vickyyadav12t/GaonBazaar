const { runListingCoach } = require("../services/groqListingCoach");
const { runFairDealCoach } = require("../services/groqFairDealCoach");
const { runHelpChatbot } = require("../services/groqHelpChatbot");
const { fetchRssArticles } = require("../services/farmerNewsRss");
const { runFarmerNewsSnapshot, getLastSnapshotFallback } = require("../services/groqFarmerNews");
const { FARMER_NEWS_SOURCES } = require("../data/farmerNewsSources");
const {
  sanitizeUserTextForAi,
  sanitizeHelpChatMessages,
} = require("../utils/sanitizeForAi");
const { runCopilot } = require("../services/groqCopilot");
const { sanitizeCopilotContext } = require("../utils/sanitizeCopilotContext");

const COPILOT_INTENTS = new Set([
  "listing_improvement",
  "harvest_postharvest",
  "deal_summary",
  "product_buyer_qa",
  "order_explain",
  "general_help",
]);

const COPILOT_DISCLAIMER =
  "AI Copilot can be wrong. For money, disputes, or account problems, use Support and your official order screens — not this chat alone.";

const NOTES_MIN = 8;
const NOTES_MAX = 2500;

/**
 * POST /api/ai/listing-coach
 * Body: { notes: string, district?: string, state?: string }
 */
exports.listingCoach = async (req, res) => {
  try {
    const notes = req.body?.notes != null ? String(req.body.notes) : "";
    const trimmed = notes.trim();

    if (trimmed.length < NOTES_MIN) {
      return res.status(400).json({
        message: `Please write at least ${NOTES_MIN} characters about your produce (Hinglish is fine).`,
      });
    }
    if (trimmed.length > NOTES_MAX) {
      return res.status(400).json({
        message: `Notes are too long (max ${NOTES_MAX} characters).`,
      });
    }

    const district =
      req.body?.district != null ? String(req.body.district).trim() : "";
    const state = req.body?.state != null ? String(req.body.state).trim() : "";

    const safeNotes = sanitizeUserTextForAi(trimmed, NOTES_MAX);
    const safeDistrict = sanitizeUserTextForAi(district, 120);
    const safeState = sanitizeUserTextForAi(state, 80);

    const suggestions = await runListingCoach(safeNotes, {
      district: safeDistrict,
      state: safeState,
    });

    return res.json({
      suggestions,
      disclaimer:
        "These are AI suggestions only. Review and edit before publishing. GaonBazaar does not guarantee prices or quality.",
    });
  } catch (err) {
    if (err.code === "GROQ_NOT_CONFIGURED") {
      return res.status(503).json({
        message:
          "Listing coach is not configured. Add GROQ_API_KEY on the server (see .env.example).",
      });
    }
    if (err.code === "GROQ_HTTP_ERROR" || err.code === "GROQ_PARSE_ERROR") {
      console.error("Groq listing coach error:", err.code, err.status, err.message);
      return res.status(502).json({
        message: "AI service temporarily unavailable. Try again in a moment.",
      });
    }
    console.error("Listing coach error:", err);
    return res.status(500).json({
      message: err.message || "Could not generate suggestions",
    });
  }
};

const FAIR_DEAL_DISCLAIMER =
  "Suggestions only. This tool does not set prices or decide the deal. GaonBazaar is not a party to your agreement. Review carefully before sending.";

/**
 * POST /api/ai/fair-deal-coach
 * Body: { chatId, mode: 'rephrase'|'questions'|'explain_term', draftText?, term? }
 * Requires: auth, buyer/farmer, participant on chat (attachFairDealChat).
 */
exports.fairDealCoach = async (req, res) => {
  const mode = String(req.body?.mode || "").toLowerCase();
  if (!["rephrase", "questions", "explain_term"].includes(mode)) {
    return res.status(400).json({
      message: "Invalid mode. Use rephrase, questions, or explain_term.",
    });
  }

  const ctx = req.fairDealContext;
  if (!ctx?.product) {
    return res.status(500).json({ message: "Missing chat context" });
  }

  try {
    if (mode === "rephrase") {
      const draft = String(req.body?.draftText != null ? req.body.draftText : "").trim();
      if (draft.length < 1) {
        return res.status(400).json({
          message: "draftText is required for rephrase mode.",
        });
      }
      if (draft.length > 800) {
        return res.status(400).json({
          message: "draftText is too long (max 800 characters).",
        });
      }
      const out = await runFairDealCoach({
        mode,
        role: ctx.role,
        product: ctx.product,
        draftText: sanitizeUserTextForAi(draft, 800),
      });
      return res.json({ ...out, disclaimer: FAIR_DEAL_DISCLAIMER });
    }

    if (mode === "questions") {
      const out = await runFairDealCoach({
        mode,
        role: ctx.role,
        product: ctx.product,
      });
      return res.json({ ...out, disclaimer: FAIR_DEAL_DISCLAIMER });
    }

    if (mode === "explain_term") {
      const term = String(req.body?.term != null ? req.body.term : "").trim();
      if (term.length < 1) {
        return res.status(400).json({
          message: "term is required for explain_term mode.",
        });
      }
      if (term.length > 120) {
        return res.status(400).json({
          message: "term is too long (max 120 characters).",
        });
      }
      const out = await runFairDealCoach({
        mode,
        role: ctx.role,
        product: ctx.product,
        term: sanitizeUserTextForAi(term, 120),
      });
      return res.json({ ...out, disclaimer: FAIR_DEAL_DISCLAIMER });
    }
  } catch (err) {
    if (err.code === "GROQ_NOT_CONFIGURED") {
      return res.status(503).json({
        message:
          "Fair deal helper is not configured. Add GROQ_API_KEY on the server (see .env.example).",
      });
    }
    if (
      err.code === "GROQ_HTTP_ERROR" ||
      err.code === "GROQ_PARSE_ERROR" ||
      err.code === "GROQ_BAD_RESPONSE"
    ) {
      console.error("Groq fair deal error:", err.code, err.status, err.message);
      return res.status(502).json({
        message: "AI service temporarily unavailable. Try again in a moment.",
      });
    }
    if (err.code === "INVALID_MODE") {
      return res.status(400).json({ message: err.message || "Invalid request" });
    }
    console.error("Fair deal coach error:", err);
    return res.status(500).json({
      message: err.message || "Could not run fair deal helper",
    });
  }
};

const HELP_CHAT_DISCLAIMER =
  "AI help may be incomplete. For account, payment, or order issues use Support in the app.";

function compactOfficialPortals(lang) {
  const hi = lang === "hi";
  return FARMER_NEWS_SOURCES.map((s) => ({
    id: s.id,
    title: hi ? s.titleHi : s.titleEn,
    url: s.url,
  }));
}

const FARMER_NEWS_DISCLAIMER = {
  en: "Headlines come from public RSS feeds (third-party publishers). GaonBazaar does not endorse or verify stories. The AI snapshot is based on headline text only — not full articles — and is not legal or agronomic advice. Always read the original source.",
  hi: "शीर्षक सार्वजनिक आरएसएस फ़ीड से हैं (तृतीय-पक्ष प्रकाशक)। गाँवबाज़ार कहानियों की पुष्टि नहीं करता। एआई सार केवल शीर्षकों पर आधारित है — पूरा लेख नहीं — और कानूनी या कृषि सलाह नहीं है। मूल स्रोत पढ़ें।",
};

/**
 * POST /api/ai/farmer-news
 * Body: { lang?: 'en'|'hi', refresh?: boolean }
 * Farmer JWT. RSS headlines + optional Groq snapshot + compact official portal links.
 */
exports.farmerNews = async (req, res) => {
  const lang = req.body?.lang === "hi" ? "hi" : "en";
  const refresh = !!req.body?.refresh;
  const disclaimer = lang === "hi" ? FARMER_NEWS_DISCLAIMER.hi : FARMER_NEWS_DISCLAIMER.en;

  let rssResult;
  try {
    rssResult = await fetchRssArticles(lang, refresh);
  } catch (err) {
    console.error("farmerNews RSS error:", err.message || err);
    rssResult = {
      articles: [],
      fetchedAt: null,
      fromCache: false,
      feedErrors: [String(err.message || "RSS error")],
    };
  }

  const { articles, fetchedAt, fromCache: rssFromCache, feedErrors } = rssResult;

  let snapshot = null;
  let snapshotGeneratedAt = null;
  let snapshotFromCache = false;
  let aiStatus = articles.length ? "missing_key" : "no_articles";
  const notices = [];

  if (Array.isArray(feedErrors) && feedErrors.length > 0) {
    notices.push(
      lang === "hi"
        ? `कुछ फ़ीड लोड नहीं हो सकीं: ${feedErrors.slice(0, 2).join("; ")}`
        : `Some feeds could not load: ${feedErrors.slice(0, 2).join("; ")}`
    );
  }

  if (articles.length > 0) {
    try {
      const out = await runFarmerNewsSnapshot({ lang, articles, refresh });
      if (!out.skipped && out.bullets?.length) {
        snapshot = out.bullets;
        snapshotGeneratedAt = out.generatedAt;
        snapshotFromCache = out.fromCache;
        aiStatus = out.fromCache ? "cached" : "fresh";
      }
    } catch (err) {
      if (err.code === "GROQ_NOT_CONFIGURED") {
        aiStatus = "missing_key";
        notices.push(
          lang === "hi"
            ? "एआई सार के लिए सर्वर पर GROQ_API_KEY जोड़ें। समाचार सूची नीचे उपलब्ध है।"
            : "Add GROQ_API_KEY on the server for the AI snapshot. Headlines are still listed below."
        );
      } else {
        console.error("farmerNews snapshot error:", err.code, err.status, err.message);
        const fb = getLastSnapshotFallback(lang);
        if (fb?.bullets?.length) {
          snapshot = fb.bullets;
          snapshotGeneratedAt = fb.generatedAt;
          snapshotFromCache = true;
          aiStatus = "stale_cache";
          notices.push(
            lang === "hi"
              ? "एआई सेवा अस्थिर थी; पुराना सार दिखाया जा रहा है।"
              : "AI service was unstable; showing the last saved snapshot."
          );
        } else {
          aiStatus = "error";
          notices.push(
            lang === "hi"
              ? "एआई सार अभी नहीं बन सका। शीर्षक सूची नीचे देखें।"
              : "Could not build the AI snapshot. Browse headlines below."
          );
        }
      }
    }
  } else if (!notices.length) {
    notices.push(
      lang === "hi"
        ? "अभी कोई समाचार शीर्षक नहीं मिला। बाद में रिफ्रेश करें।"
        : "No headlines loaded yet. Try refreshing in a moment."
    );
  }

  return res.json({
    articles,
    rssFetchedAt: fetchedAt,
    rssFromCache,
    feedErrors: feedErrors || [],
    snapshot,
    snapshotGeneratedAt,
    snapshotFromCache,
    aiStatus,
    officialPortals: compactOfficialPortals(lang),
    disclaimer,
    notice: notices.length ? notices.join(" ") : undefined,
  });
};

/**
 * POST /api/ai/copilot
 * Unified AI (Groq) with intent detection — listings, harvest, deals, product Q&A, orders, app help.
 * Body: { messages: { role: 'user'|'assistant', content: string }[], lang?, context? }
 * Auth: farmer or buyer only.
 */
exports.copilot = async (req, res) => {
  const role = req.user?.role;
  if (role !== "farmer" && role !== "buyer") {
    return res.status(403).json({ message: "Copilot is only for farmers and buyers." });
  }

  const lang = req.body?.lang === "hi" ? "hi" : "en";
  const raw = req.body?.messages;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 28) {
    return res.status(400).json({
      message: "messages must be a non-empty array (max 28 turns).",
    });
  }

  const messages = [];
  for (let i = 0; i < raw.length; i += 1) {
    const m = raw[i];
    const r = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    if (!r) {
      return res.status(400).json({ message: "Each message needs role user or assistant." });
    }
    const content = String(m?.content != null ? m.content : "").trim();
    if (content.length < 1) {
      return res.status(400).json({ message: "Empty message not allowed." });
    }
    if (content.length > 4000) {
      return res.status(400).json({ message: "Message too long (max 4000 characters)." });
    }
    messages.push({ role: r, content });
  }

  if (messages[0].role !== "user") {
    return res.status(400).json({ message: "Conversation must start with a user message." });
  }
  if (messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ message: "Last message must be from the user." });
  }

  const safeMessages = sanitizeHelpChatMessages(messages, 4000);
  const context = sanitizeCopilotContext(req.body?.context);

  try {
    const { intent, reply } = await runCopilot({
      messages: safeMessages,
      lang,
      userRole: role,
      context,
    });
    const safeIntent = COPILOT_INTENTS.has(intent) ? intent : "general_help";
    return res.json({
      intent: safeIntent,
      reply,
      disclaimer: COPILOT_DISCLAIMER,
    });
  } catch (err) {
    if (err.code === "GROQ_NOT_CONFIGURED") {
      return res.status(503).json({
        message:
          "Copilot is not configured. Add GROQ_API_KEY on the server (see .env.example).",
      });
    }
    if (
      err.code === "GROQ_HTTP_ERROR" ||
      err.code === "GROQ_PARSE_ERROR" ||
      err.code === "GROQ_BAD_RESPONSE"
    ) {
      console.error("Groq copilot error:", err.code, err.status, err.message);
      return res.status(502).json({
        message: "AI Copilot temporarily unavailable. Try again in a moment.",
      });
    }
    console.error("copilot error:", err);
    return res.status(500).json({
      message: err.message || "Could not run Copilot",
    });
  }
};

/**
 * POST /api/ai/help-chat
 * Body: { messages: { role: 'user'|'assistant', content: string }[], lang?: 'en'|'hi' }
 * Optional Bearer — improves per-user rate limits when logged in.
 */
exports.helpChat = async (req, res) => {
  const lang = req.body?.lang === "hi" ? "hi" : "en";
  const raw = req.body?.messages;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 24) {
    return res.status(400).json({
      message: "messages must be a non-empty array (max 24 turns).",
    });
  }

  const messages = [];
  for (let i = 0; i < raw.length; i += 1) {
    const m = raw[i];
    const role =
      m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    if (!role) {
      return res.status(400).json({
        message: "Each message needs role user or assistant.",
      });
    }
    const content = String(m?.content != null ? m.content : "").trim();
    if (content.length < 1) {
      return res.status(400).json({ message: "Empty message not allowed." });
    }
    if (content.length > 2000) {
      return res.status(400).json({
        message: "Message too long (max 2000 characters).",
      });
    }
    messages.push({ role, content });
  }

  if (messages[0].role !== "user") {
    return res.status(400).json({
      message: "Conversation must start with a user message.",
    });
  }
  if (messages[messages.length - 1].role !== "user") {
    return res.status(400).json({
      message: "Last message must be from the user.",
    });
  }

  try {
    const safeMessages = sanitizeHelpChatMessages(messages, 2000);
    const { reply } = await runHelpChatbot({ messages: safeMessages, lang });
    return res.json({
      reply,
      disclaimer: HELP_CHAT_DISCLAIMER,
    });
  } catch (err) {
    if (err.code === "GROQ_NOT_CONFIGURED") {
      return res.status(503).json({
        message:
          "Help chat is not configured. Add GROQ_API_KEY on the server (see .env.example).",
      });
    }
    if (
      err.code === "GROQ_HTTP_ERROR" ||
      err.code === "GROQ_PARSE_ERROR" ||
      err.code === "GROQ_BAD_RESPONSE"
    ) {
      console.error("Groq help chat error:", err.code, err.status, err.message);
      return res.status(502).json({
        message: "Help assistant temporarily unavailable. Try again in a moment.",
      });
    }
    console.error("helpChat error:", err);
    return res.status(500).json({
      message: err.message || "Could not get help reply",
    });
  }
};
