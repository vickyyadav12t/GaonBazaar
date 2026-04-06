const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// JWT + suspended-account check (one DB read per authenticated request)
module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const u = await User.findById(decoded.id).select("accountStatus").lean();
    if (!u) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    if (u.accountStatus === "suspended") {
      return res.status(403).json({
        message:
          "Your account has been suspended. Contact support if you believe this is a mistake.",
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

