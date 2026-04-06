/**
 * Farmer avatar from API (`farmer.avatar` on populated products).
 * Uploads return absolute URLs; older data may store `/uploads/...` relative paths.
 */
export function resolveFarmerAvatarUrl(avatar: string | null | undefined): string | undefined {
  const s = typeof avatar === 'string' ? avatar.trim() : '';
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const origin = apiBase.replace(/\/api$/, '') || 'http://localhost:5000';
    return `${origin}${s}`;
  }
  return s;
}
