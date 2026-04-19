import { resolveBackendAssetUrl } from '@/lib/productImageUrl';

/**
 * Farmer avatar from API (`farmer.avatar` on populated products) or user profile.
 * Handles `/uploads/...`, `uploads/...`, and dev-only `http://localhost:.../uploads/...` URLs.
 */
export function resolveFarmerAvatarUrl(avatar: string | null | undefined): string | undefined {
  const s = typeof avatar === 'string' ? avatar.trim() : '';
  if (!s) return undefined;
  const out = resolveBackendAssetUrl(s);
  return out || undefined;
}
