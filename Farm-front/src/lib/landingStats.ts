/** `live` = show counts from GET /api/public/landing-stats. Anything else = honest marketing copy (no fake numbers). */
export type LandingStatsMode = 'live' | 'marketing';

export function getLandingStatsMode(): LandingStatsMode {
  const v = (import.meta.env.VITE_LANDING_STATS_MODE || '').trim().toLowerCase();
  return v === 'live' ? 'live' : 'marketing';
}

export function formatLandingInteger(n: number): string {
  const x = Math.max(0, Math.floor(Number(n) || 0));
  return new Intl.NumberFormat('en-IN').format(x);
}

export type PublicLandingStats = {
  farmerCount: number;
  buyerCount: number;
  deliveredDeals: number;
  activeListings: number;
};
