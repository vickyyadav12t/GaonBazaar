/**
 * Helmet configuration for the API + static /uploads.
 * CSP on JSON responses is mostly inert for XHR/fetch but hardens direct browser opens of API URLs.
 * Tune via env; disable CSP locally if a proxy strips headers you need to debug.
 */

const isProd = process.env.NODE_ENV === "production";

function getHelmetMiddleware() {
  const helmet = require("helmet");

  const disableCsp = String(process.env.HELMET_DISABLE_CSP || "").trim() === "1";

  const cspDirectives = {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    ...(isProd ? { upgradeInsecureRequests: [] } : {}),
  };

  return helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: disableCsp
      ? false
      : {
          useDefaults: false,
          directives: cspDirectives,
        },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: isProd
      ? {
          maxAge: 15552000,
          includeSubDomains: true,
          preload: false,
        }
      : false,
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    frameguard: { action: "deny" },
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  });
}

module.exports = { getHelmetMiddleware };
