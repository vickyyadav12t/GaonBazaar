const express = require("express");
const http = require("http");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Chat = require("./models/Chat");
const { getCorsMiddlewareOptions, getSocketIoCorsConfig } = require("./utils/corsConfig");
const { getHelmetMiddleware } = require("./utils/securityHeaders");
const { redactUrlForLog, redactUserIdForLog } = require("./utils/redactForLog");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");
const adminRoutes = require("./routes/admin.routes");
const chatRoutes = require("./routes/chat.routes");
const notificationRoutes = require("./routes/notification.routes");
const uploadRoutes = require("./routes/upload.routes");
const earningsRoutes = require("./routes/earnings.routes");
const paymentRoutes = require("./routes/payment.routes");
const supportRoutes = require("./routes/support.routes");
const calendarRoutes = require("./routes/calendar.routes");
const aiRoutes = require("./routes/ai.routes");
const publicRoutes = require("./routes/public.routes");
const path = require("path");

dotenv.config();
const { isMailConfigured, verifyMailConnection } = require("./utils/mail");

const app = express();
const server = http.createServer(app);

/**
 * Required behind Render/nginx so req.ip is the real client — otherwise rate limiting
 * treats all users as one IP and returns 429 for /api/auth/login almost immediately.
 * Set TRUST_PROXY=0 to force off (rare).
 */
function shouldTrustProxy() {
  const t = String(process.env.TRUST_PROXY || "").trim().toLowerCase();
  if (t === "0" || t === "false" || t === "no") return false;
  if (t === "1" || t === "true" || t === "yes") return true;
  // Render.com Web Services set RENDER=true automatically
  if (String(process.env.RENDER || "").toLowerCase() === "true") return true;
  return false;
}

const trustProxyEnabled = shouldTrustProxy();
app.set("trust proxy", trustProxyEnabled ? 1 : false);
if (trustProxyEnabled) {
  console.log("[http] trust proxy enabled (per-client IP for rate limiting)");
} else {
  console.warn(
    "[http] trust proxy disabled — use TRUST_PROXY=1 or deploy on Render (RENDER=true) to avoid shared 429s behind a reverse proxy"
  );
}

app.use(getHelmetMiddleware());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const pathForLog = redactUrlForLog(req.originalUrl);
    console.log(`${req.method} ${pathForLog} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use(cors(getCorsMiddlewareOptions()));

/** Auth endpoints (login, send-email-code, forgot-password) get their own budget so they are not starved by other /api traffic. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_DISABLED === "1",
  message: {
    message:
      "Too many authentication attempts from this network. Please wait a few minutes and try again.",
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.RATE_LIMIT_DISABLED === "1") return true;
    const url = req.originalUrl || req.url || "";
    return url.startsWith("/api/auth");
  },
  message: {
    message: "Too many requests from this network. Please wait a few minutes and try again.",
  },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// Increase JSON body size for image data URLs (dev-only approach).
// In production, prefer real file uploads (S3/Cloudinary) instead of base64 in JSON.
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    if (!isMailConfigured()) {
      console.warn(
        "[mail] SMTP not configured — transactional email is disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS (see .env.example). Password reset, order emails, and support mail will not send."
      );
    } else {
      await verifyMailConnection().catch(() => {});
    }
  })
  .catch((err) => console.log(err));

// Health check
app.get("/", (req, res) => {
  res.send("Farm Bazzar API running");
});

// Public read-only JSON (landing page stats, etc.)
app.use("/api/public", publicRoutes);

// Auth routes (password-based, no OTP)
app.use("/api/auth", authRoutes);

// User routes (protected with JWT)
app.use("/api/users", userRoutes);

// Product routes (public listing, protected CRUD)
app.use("/api/products", productRoutes);

// Order routes (all protected with JWT)
app.use("/api/orders", orderRoutes);

// Razorpay: create checkout order + verify signature (buyer-only)
app.use("/api/payments", paymentRoutes);

// Review routes (all protected with JWT)
app.use("/api/reviews", reviewRoutes);

// Admin routes (protected with JWT + admin role checks)
app.use("/api/admin", adminRoutes);

// Chat routes (protected with JWT)
app.use("/api/chats", chatRoutes);

// Notification routes (protected with JWT)
app.use("/api/notifications", notificationRoutes);

// Upload routes (protected with JWT + role checks)
app.use("/api/uploads", uploadRoutes);

// Farmer earnings & withdrawals
app.use("/api/earnings", earningsRoutes);

// Support tickets (optional auth)
app.use("/api/support", supportRoutes);

// Public seasonal crop calendar + optional farmer personalization
app.use("/api/calendar", calendarRoutes);

// AI helpers (Groq) — farmer-only, JWT required
app.use("/api/ai", aiRoutes);

const io = new Server(server, {
  cors: getSocketIoCorsConfig(),
});

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
if (JWT_SECRET === "dev-secret-key" && process.env.NODE_ENV === "production") {
  console.warn("WARNING: JWT_SECRET is unset — set a strong secret before production.");
}

io.use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const bearer = socket.handshake.headers?.authorization;
    const headerToken =
      typeof bearer === "string" && bearer.startsWith("Bearer ")
        ? bearer.split(" ")[1]
        : null;
    const token = authToken || headerToken;

    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Socket.io: missing token (send auth: { token } from the client).");
      }
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (_err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Socket.io: JWT invalid or expired — refresh login and retry.");
    }
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const uid = socket.user?.id;
  const uidLog = uid != null ? redactUserIdForLog(uid) : "";
  console.log("User connected:", socket.id, "user:", uidLog || "(anon)");

  if (uid) {
    socket.join(`user:${String(uid)}`);
  }

  socket.on("chat:join", async (chatId) => {
    try {
      if (!chatId || !socket.user?.id) return;

      const chat = await Chat.findById(chatId).select("buyer farmer");
      if (!chat) return;

      const isParticipant =
        String(chat.buyer) === String(socket.user.id) ||
        String(chat.farmer) === String(socket.user.id) ||
        socket.user.role === "admin";

      if (!isParticipant) return;

      socket.join(`chat:${chatId}`);
    } catch (err) {
      console.error("Socket join chat error:", err.message);
    }
  });

  socket.on("chat:leave", (chatId) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
