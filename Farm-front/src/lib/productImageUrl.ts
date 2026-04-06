/**
 * Tune remote URLs for lighter card images (smaller decode cost, less CLS when width/height set).
 * Unsplash: auto=format serves WebP/AVIF based on Accept; w/q reduce bytes.
 */
export function optimizeListingImageUrl(url: string, width = 640): string {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  try {
    const u = new URL(url);
    if (/images\.unsplash\.com$/i.test(u.hostname)) {
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '78');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return url;
}
