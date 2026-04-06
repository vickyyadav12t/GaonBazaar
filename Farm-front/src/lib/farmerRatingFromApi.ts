/** Map API product `farmerAvgRating` to ProductCard `farmerRating` (1 decimal, 0 if unknown). */
export function farmerRatingFromApi(p: { farmerAvgRating?: unknown }): number {
  const v = p.farmerAvgRating;
  if (v != null && Number.isFinite(Number(v))) {
    return Math.round(Number(v) * 10) / 10;
  }
  return 0;
}
