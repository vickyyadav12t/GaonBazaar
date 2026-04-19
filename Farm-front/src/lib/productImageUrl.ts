/**
 * Tune remote URLs for lighter card images (smaller decode cost, less CLS when width/height set).
 * Unsplash: auto=format serves WebP/AVIF based on Accept; w/q reduce bytes.
 */
import { getSocketOrigin } from '@/lib/resolveApiBaseUrl';

/** Neutral placeholder — not a specific crop (avoids “Potato” showing a grain stock photo). */
export const LISTING_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e8eef2"/>
          <stop offset="100%" style="stop-color:#d4dde4"/>
        </linearGradient>
      </defs>
      <rect fill="url(#gb)" width="800" height="600"/>
      <rect x="280" y="200" width="240" height="160" rx="16" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="12 8"/>
      <text x="400" y="285" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="22">No photo</text>
      <text x="400" y="318" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="15">Add an image in listing settings</text>
    </svg>`
  );

/** Drop empty / whitespace-only entries (bad DB rows like `[""]`). */
export function sanitizeImageUrlList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  for (const x of images) {
    if (x == null) continue;
    const s = String(x).trim();
    if (s) out.push(s);
  }
  return out;
}

export function firstValidImageFromList(images: unknown): string | undefined {
  const list = sanitizeImageUrlList(images);
  return list[0];
}

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
  if (url.startsWith('uploads/') || url.startsWith('uploads\\')) {
    return `${getSocketOrigin()}/${url.replace(/^[\\/]+/, '')}`;
  }
  if (url.startsWith('/uploads/') || url === '/uploads' || url.startsWith('/uploads?')) {
    return `${getSocketOrigin()}${url}`;
  }
  if (url.startsWith('/api/uploads/')) {
    return `${getSocketOrigin()}${url.replace(/^\/api/, '')}`;
  }
  return url;
}

/**
 * Some old data stores localhost absolute URLs (e.g. http://localhost:5000/uploads/..).
 * Rewrite those to the current backend origin so other devices can load them.
 */
export function normalizePossiblyLocalAbsoluteUrl(rawUrl: string): string {
  const url = String(rawUrl || '').trim();
  if (!url) return url;
  if (!isAbsoluteHttpUrl(url)) return url;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return `${getSocketOrigin()}${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

/**
 * Tune image URLs for lighter card images (smaller decode cost, less CLS when width/height set).
 * - Prefix backend `/uploads/...` paths with the backend origin.
 * - Unsplash: auto=format serves WebP/AVIF based on Accept; w/q reduce bytes.
 */
export function optimizeListingImageUrl(rawUrl: string, width = 640): string {
  const url = resolveBackendAssetUrl(normalizePossiblyLocalAbsoluteUrl(rawUrl));
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

/**
 * Single hero URL for cards: resolve + optimize, or neutral SVG if missing / not loadable as absolute HTTP(S) / data.
 */
export function listingHeroImageUrl(raw: string | undefined | null, width: number): string {
  const trimmed = raw?.trim();
  if (!trimmed) return LISTING_IMAGE_PLACEHOLDER;
  const u = optimizeListingImageUrl(trimmed, width);
  if (!u || typeof u !== 'string') return LISTING_IMAGE_PLACEHOLDER;
  if (u.startsWith('data:') || u.startsWith('blob:')) return u;
  if (!/^https?:\/\//i.test(u)) return LISTING_IMAGE_PLACEHOLDER;
  return u;
}

export function listingHeroImageUrlFromList(images: unknown, width: number): string {
  return listingHeroImageUrl(firstValidImageFromList(images), width);
}
