const crypto = require("crypto");
const Parser = require("rss-parser");
const { FEEDS_EN, FEEDS_HI } = require("../data/farmerNewsRssFeeds");

const RSS_CACHE_MS =
  Number(process.env.FARMER_NEWS_RSS_CACHE_MS) > 0
    ? Number(process.env.FARMER_NEWS_RSS_CACHE_MS)
    : 25 * 60 * 1000;

const FETCH_TIMEOUT_MS = 14000;
const MAX_ARTICLES = 28;

/** @type {Map<string, { at: number, articles: object[] }>} */
const rssCache = new Map();

const parser = new Parser({
  headers: {
    "User-Agent": "GaonBazaarFarmerNews/1.0 (+https://gaonbazaar.example)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: FETCH_TIMEOUT_MS,
});

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stableArticleId(link) {
  const u = String(link || "").trim();
  if (!u) return crypto.randomBytes(8).toString("hex");
  return crypto.createHash("sha256").update(u).digest("hex").slice(0, 16);
}

async function fetchOneFeed(feed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: parser.options.headers,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const xml = await res.text();
    const doc = await parser.parseString(xml);
    const out = [];
    const items = Array.isArray(doc.items) ? doc.items : [];
    for (const it of items) {
      const link = String(it.link || it.guid || "").trim();
      const title = stripHtml(it.title || "").slice(0, 300);
      if (!link || !title) continue;
      const rawContent = it.contentSnippet || it.summary || it.content || "";
      const summary = stripHtml(rawContent).slice(0, 380);
      let publishedAt = null;
      if (it.pubDate) {
        const d = new Date(it.pubDate);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      } else if (it.isoDate) {
        const d = new Date(it.isoDate);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      }
      out.push({
        id: stableArticleId(link),
        title,
        link,
        source: feed.source,
        publishedAt,
        summary: summary || "",
      });
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {'en'|'hi'} lang
 * @param {boolean} refresh
 * @returns {Promise<{ articles: object[], fetchedAt: string, fromCache: boolean, feedErrors: string[] }>}
 */
async function fetchRssArticles(lang, refresh) {
  const key = lang === "hi" ? "hi" : "en";
  if (!refresh) {
    const hit = rssCache.get(key);
    if (hit && Date.now() - hit.at < RSS_CACHE_MS) {
      return {
        articles: hit.articles,
        fetchedAt: new Date(hit.at).toISOString(),
        fromCache: true,
        feedErrors: [],
      };
    }
  } else {
    rssCache.delete(key);
  }

  const feeds = key === "hi" ? FEEDS_HI : FEEDS_EN;
  const feedErrors = [];
  const batches = await Promise.allSettled(
    feeds.map(async (f) => {
      try {
        return await fetchOneFeed(f);
      } catch (e) {
        feedErrors.push(`${f.source}: ${e.message || "failed"}`);
        return [];
      }
    })
  );

  const merged = [];
  const seen = new Set();
  for (const b of batches) {
    if (b.status !== "fulfilled") continue;
    for (const a of b.value) {
      if (seen.has(a.link)) continue;
      seen.add(a.link);
      merged.push(a);
    }
  }

  merged.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  const articles = merged.slice(0, MAX_ARTICLES);
  const at = Date.now();
  rssCache.set(key, { at, articles });

  return {
    articles,
    fetchedAt: new Date(at).toISOString(),
    fromCache: false,
    feedErrors,
  };
}

module.exports = { fetchRssArticles };
