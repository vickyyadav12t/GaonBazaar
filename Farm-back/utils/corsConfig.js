/**
 * CORS origins from env (comma-separated). Used by Express and Socket.IO.
 * CORS_ORIGINS or CORS_ALLOW_ORIGINS — e.g. "http://localhost:8080,https://app.example.com"
 */

/**
 * When CORS_ORIGINS is unset: in development, allow common local frontend URLs
 * (Vite default 5173, this repo’s Vite port 8080, CRA 3000, localhost vs 127.0.0.1).
 * Socket.IO uses the same list — a mismatch closes the WebSocket during handshake.
 */
function defaultOriginsWhenUnset() {
  if (process.env.NODE_ENV === "production") {
    return ["http://localhost:8080"];
  }
  const ports = [8080, 5173, 5174, 3000];
  const hosts = ["http://localhost", "http://127.0.0.1"];
  const out = [];
  for (const h of hosts) {
    for (const p of ports) {
      out.push(`${h}:${p}`);
    }
  }
  return out;
}

function parseAllowedOrigins() {
  const raw = (process.env.CORS_ORIGINS || process.env.CORS_ALLOW_ORIGINS || "").trim();
  if (!raw) {
    return defaultOriginsWhenUnset();
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Express / cors middleware: (origin, callback) => void
 * Allows non-browser clients (no Origin header) when allowNoOrigin is true (default).
 */
function createCorsOriginCallback(allowedList, { allowNoOrigin = true } = {}) {
  return (origin, callback) => {
    if (!origin) {
      return callback(null, allowNoOrigin);
    }
    if (allowedList.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  };
}

function getCorsMiddlewareOptions() {
  const allowed = parseAllowedOrigins();
  return {
    origin: createCorsOriginCallback(allowed),
    credentials: true,
  };
}

function getSocketIoCorsConfig() {
  const allowed = parseAllowedOrigins();
  return {
    origin: createCorsOriginCallback(allowed),
    credentials: true,
  };
}

module.exports = {
  parseAllowedOrigins,
  createCorsOriginCallback,
  getCorsMiddlewareOptions,
  getSocketIoCorsConfig,
};
