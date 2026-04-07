/**
 * Tune remote URLs for lighter card images (smaller decode cost, less CLS when width/height set).
 * Unsplash: auto=format serves WebP/AVIF based on Accept; w/q reduce bytes.
 */
import { getSocketOrigin } from '@/lib/resolveApiBaseUrl';

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Backend images are often stored as `/uploads/...` paths. On non-local devices,
 * the frontend origin differs from the backend origin, so we must prefix the backend.
 */
export function resolveBackendAssetUrl(rawUrl: string): string {
  const url = String(rawUrl || '').trim();
  if (!url) return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (isAbsoluteHttpUrl(url)) return url;

  // Only rewrite known backend asset paths to avoid breaking SPA-relative assets.
  if (url.startsWith('/uploads/') || url === '/uploads' || url.startsWith('/uploads?')) {
    return `${getSocketOrigin()}${url}`;
  }
  if (url.startsWith('/api/uploads/')) {
    return `${getSocketOrigin()}${url.replace(/^\/api/, '')}`;
  }
  return url;
}

/**
 * Tune image URLs for lighter card images (smaller decode cost, less CLS when width/height set).
 * - Prefix backend `/uploads/...` paths with the backend origin.
 * - Unsplash: auto=format serves WebP/AVIF based on Accept; w/q reduce bytes.
 */
export function optimizeListingImageUrl(rawUrl: string, width = 640): string {
  const url = resolveBackendAssetUrl(rawUrl);
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (!isAbsoluteHttpUrl(url)) return url;
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
