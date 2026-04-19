/**
 * Rewrite localhost upload URLs in API responses so production frontends (Vercel)
 * request files from the real host instead of the end-user's machine.
 *
 * Does not create missing files: if the asset was never on the server disk
 * (e.g. only existed on a dev laptop), the URL is still correct but may 404
 * until the farmer re-uploads (prefer Cloudinary on Render).
 */

function trimEnv(s) {
  return String(s || "")
    .trim()
    .replace(/\/+$/, "");
}

/**
 * Public site origin without trailing slash, e.g. https://my-api.onrender.com
 * Render sets RENDER_EXTERNAL_URL automatically for Web Services.
 */
function getPublicOrigin() {
  const explicit = trimEnv(process.env.PUBLIC_BASE_URL);
  if (explicit) {
    return explicit.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  }
  const render = trimEnv(process.env.RENDER_EXTERNAL_URL);
  if (render) return render.replace(/\/+$/, "");
  return "";
}

/**
 * If URL is http(s)://localhost|127.0.0.1/.../uploads/..., replace origin with getPublicOrigin().
 */
function rewriteLocalhostUploadUrl(url) {
  const u = String(url || "").trim();
  if (!u) return u;
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return u;
  }
  if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    return u;
  }
  if (!parsed.pathname.startsWith("/uploads")) {
    return u;
  }
  const origin = getPublicOrigin();
  if (!origin) return u;
  return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/** Mutates plain product (from toObject/lean) in place; safe if already plain. */
function rewriteProductAssetUrls(plain) {
  if (!plain || typeof plain !== "object") return plain;
  if (Array.isArray(plain.images)) {
    plain.images = plain.images.map((x) => rewriteLocalhostUploadUrl(x));
  }
  if (plain.farmer && typeof plain.farmer === "object" && plain.farmer.avatar) {
    plain.farmer.avatar = rewriteLocalhostUploadUrl(plain.farmer.avatar);
  }
  return plain;
}

/**
 * Base URL for newly persisted disk uploads (listing/avatar when Cloudinary is off).
 * Prefer env so URLs stay valid after deploy; else fall back to request host.
 */
function getUploadResponseBaseUrl(req) {
  const fromEnv = getPublicOrigin();
  if (fromEnv) return fromEnv;
  return `${req.protocol}://${req.get("host")}`;
}

/**
 * Clone via JSON and rewrite any string that is a localhost /uploads URL.
 * Use for nested payloads (orders with populated products) without hand-walking shapes.
 */
function rewriteDeepLocalhostUploads(obj) {
  if (obj == null) return obj;
  let cloned;
  try {
    cloned = JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
  function walk(x) {
    if (typeof x === "string") return rewriteLocalhostUploadUrl(x);
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === "object") {
      for (const k of Object.keys(x)) {
        x[k] = walk(x[k]);
      }
    }
    return x;
  }
  return walk(cloned);
}

module.exports = {
  getPublicOrigin,
  rewriteLocalhostUploadUrl,
  rewriteProductAssetUrls,
  getUploadResponseBaseUrl,
  rewriteDeepLocalhostUploads,
};
