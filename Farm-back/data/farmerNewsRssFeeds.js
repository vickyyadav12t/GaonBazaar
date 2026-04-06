/**
 * Public RSS feeds aggregated for farmer-relevant headlines (India-focused).
 * Feeds may change URLs; failures are handled per-feed.
 */
const FEEDS_EN = [
  {
    source: "Google News — agriculture & farming (India)",
    url: "https://news.google.com/rss/search?q=agriculture+OR+farming+OR+crops+OR+MSP+OR+mandi+India&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    source: "Economic Times — Agriculture",
    url: "https://economictimes.indiatimes.com/rssfeeds/1199376011.cms",
  },
];

const FEEDS_HI = [
  {
    source: "Google News — कृषि व किसान (भारत)",
    url: "https://news.google.com/rss/search?q=कृषि+किसान+फसल+मंडी+भारत&hl=hi&gl=IN&ceid=IN:hi",
  },
  {
    source: "Economic Times — Agriculture",
    url: "https://economictimes.indiatimes.com/rssfeeds/1199376011.cms",
  },
];

module.exports = { FEEDS_EN, FEEDS_HI };
