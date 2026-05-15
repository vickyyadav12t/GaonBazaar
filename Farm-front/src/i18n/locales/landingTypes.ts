export type LandingMarketingCard = { emoji: string; title: string; sub: string };

export type LandingContent = {
  hero: {
    trustBadgeSoft: string;
    title: string;
    subtitle: string;
    description: string;
    cta1: string;
    cta2: string;
    quickFarmers: string;
    quickBuyers: string;
    quickTx: string;
    quickListings: string;
    marketingHeroStrip: string[];
  };
  features: {
    title: string;
    subtitle: string;
    items: { title: string; desc: string }[];
  };
  stats: {
    farmers: string;
    buyers: string;
    transactions: string;
    listings: string;
    marketingCards: LandingMarketingCard[];
  };
  statsLoadError: string;
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; desc: string }[];
  };
  featured: {
    title: string;
    desc: string;
    cta: string;
  };
  testimonials: {
    title: string;
    attribution: string;
    role: string;
    regionNorth: string;
    regionWest: string;
    regionSouth: string;
    quoteNorth: string;
    quoteWest: string;
    quoteSouth: string;
  };
  cta: {
    title: string;
    desc: string;
    button: string;
    browse: string;
    zapLine: string;
    trustSecure: string;
    trustVerified: string;
    trustSupport: string;
  };
  trustLive: (farmerCount: string, buyerCount: string) => string;
};
