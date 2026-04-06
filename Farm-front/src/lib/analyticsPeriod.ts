/** Rolling window start (inclusive) for farmer analytics filters. */
export function getAnalyticsPeriodStart(
  period: 'week' | 'month' | 'quarter' | 'year',
  now = new Date()
): Date {
  const d = new Date(now);
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - 7);
      break;
    case 'month':
      d.setDate(d.getDate() - 30);
      break;
    case 'quarter':
      d.setDate(d.getDate() - 90);
      break;
    case 'year':
      d.setDate(d.getDate() - 365);
      break;
    default:
      d.setDate(d.getDate() - 30);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOrderInPeriod(createdAt: string, periodStart: Date, now = new Date()): boolean {
  const t = new Date(createdAt).getTime();
  return t >= periodStart.getTime() && t <= now.getTime();
}
