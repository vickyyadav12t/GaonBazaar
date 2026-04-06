/**
 * Backend mounts all REST routes under `/api`. Base URL must be e.g.
 * `https://your-service.onrender.com/api`.
 * If VITE_API_BASE_URL is set without `/api` (common on Vercel), we append it
 * so `/auth/google` and other paths resolve correctly.
 */
export function getApiBaseUrl(): string {
  const fallback = 'http://localhost:5000/api';
  const raw = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return fallback;
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

/** Socket.IO server origin (same host as API, no `/api` suffix). */
export function getSocketOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}
