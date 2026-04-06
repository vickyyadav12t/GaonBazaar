const { sanitizeUserTextForAi } = require("./sanitizeForAi");

const ALLOWED_PAGES = new Set([
  "marketplace",
  "product",
  "listing",
  "order",
  "chat",
  "dashboard",
  "other",
]);

/**
 * Whitelist and size-limit optional page context for the unified copilot.
 * @param {unknown} raw
 * @returns {object|null}
 */
function sanitizeCopilotContext(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const src = /** @type {Record<string, unknown>} */ (raw);
  const out = {};

  const page = String(src.page || "").trim().toLowerCase().slice(0, 32);
  if (page && ALLOWED_PAGES.has(page)) out.page = page;

  if (src.product && typeof src.product === "object") {
    const p = /** @type {Record<string, unknown>} */ (src.product);
    const price = p.price;
    out.product = {
      name: sanitizeUserTextForAi(p.name, 220),
      category: sanitizeUserTextForAi(p.category, 80),
      unit: sanitizeUserTextForAi(p.unit, 40),
      price: typeof price === "number" && Number.isFinite(price) ? price : undefined,
      organic: !!p.organic,
      negotiable: !!p.negotiable,
      description: sanitizeUserTextForAi(p.description, 700),
    };
  }

  if (src.listing && typeof src.listing === "object") {
    const l = /** @type {Record<string, unknown>} */ (src.listing);
    out.listing = {
      title: sanitizeUserTextForAi(l.title, 200),
      description: sanitizeUserTextForAi(l.description, 1200),
      category: sanitizeUserTextForAi(l.category, 80),
      unit: sanitizeUserTextForAi(l.unit, 40),
      notes: sanitizeUserTextForAi(l.notes, 1200),
    };
  }

  if (src.order && typeof src.order === "object") {
    const o = /** @type {Record<string, unknown>} */ (src.order);
    out.order = {
      status: sanitizeUserTextForAi(o.status, 60),
      paymentStatus: sanitizeUserTextForAi(o.paymentStatus, 60),
      paymentMethod: sanitizeUserTextForAi(o.paymentMethod, 80),
      totalText: sanitizeUserTextForAi(o.totalText, 120),
      itemsSummary: sanitizeUserTextForAi(o.itemsSummary, 900),
      roleView: o.roleView === "farmer" || o.roleView === "buyer" ? o.roleView : undefined,
    };
  }

  if (src.chat && typeof src.chat === "object") {
    const c = /** @type {Record<string, unknown>} */ (src.chat);
    out.chat = {
      productName: sanitizeUserTextForAi(c.productName, 200),
      excerpt: sanitizeUserTextForAi(c.excerpt, 2800),
      negotiationStatus: sanitizeUserTextForAi(c.negotiationStatus, 40),
    };
  }

  if (src.harvest && typeof src.harvest === "object") {
    const h = /** @type {Record<string, unknown>} */ (src.harvest);
    out.harvest = {
      crop: sanitizeUserTextForAi(h.crop, 120),
      storage: sanitizeUserTextForAi(h.storage, 200),
      district: sanitizeUserTextForAi(h.district, 80),
      state: sanitizeUserTextForAi(h.state, 80),
      notes: sanitizeUserTextForAi(h.notes, 900),
    };
  }

  return Object.keys(out).length ? out : null;
}

module.exports = { sanitizeCopilotContext };
