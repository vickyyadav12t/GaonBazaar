const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// If a Bearer token is present, verify and attach req.user (unless suspended).
// Otherwise continue without authentication.
module.exports = async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const u = await User.findById(decoded.id).select("accountStatus").lean();
    if (u && u.accountStatus !== "suspended") {
      req.user = decoded;
    }
  } catch (err) {
    // Ignore invalid token for optional auth (treat as unauthenticated)
  }

  return next();
};

