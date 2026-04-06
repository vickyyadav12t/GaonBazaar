const User = require("../models/User");
const { sanitizeUser } = require("./user.controller");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Withdrawal = require("../models/Withdrawal");
const AuditLog = require("../models/AuditLog");
const SupportTicket = require("../models/SupportTicket");
const { logAudit } = require("../utils/auditLog");
const { sendMail, isMailConfigured } = require("../utils/mail");
const { serializeSupportTicketForApi } = require("./support.controller");
const { attachAdminUserStats } = require("../utils/adminUserStats");
const { createNotificationIfAllowed } = require("../utils/notificationDispatch");
const { countLinkedOrdersByStatus, LINKED_ORDER_STAGES } = require("../utils/orderLinked");

const buildAdminWithdrawal = (w) => {
  if (!w) return null;
  const plain = w.toObject ? w.toObject() : w;
  const farmer = plain.farmer;
  return {
    id: String(plain._id),
    farmerId: farmer?._id ? String(farmer._id) : String(plain.farmer),
    farmerName: farmer?.name || "Farmer",
    farmerPhone: farmer?.phone || "",
    farmerEmail: farmer?.email || "",
    amount: plain.amount,
    bankAccount: {
      accountNumber: plain.accountNumber || "",
      ifscCode: plain.ifscCode || "",
      bankName: plain.bankName || "",
      accountHolderName: plain.accountHolderName || "",
    },
    status: plain.status,
    requestedAt: plain.createdAt
      ? new Date(plain.createdAt).toISOString()
      : new Date().toISOString(),
    processedAt: plain.processedAt
      ? new Date(plain.processedAt).toISOString()
      : undefined,
    rejectionReason: plain.rejectionReason,
  };
};

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
};

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const stockTestNameRe = /^StockTest\s+(Buyer\s+[AB]|Farmer)\b/i;
    const nonStockTestUser = { name: { $not: stockTestNameRe } };

    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      pendingKYC,
      activeListings,
      totalProducts,
      linkedOrderStatus,
      revenueAgg,
      pendingReviews,
      pendingWithdrawals,
      openSupportTickets,
    ] = await Promise.all([
      User.countDocuments({ ...nonStockTestUser }),
      User.countDocuments({ ...nonStockTestUser, role: "farmer" }),
      User.countDocuments({ ...nonStockTestUser, role: "buyer" }),
      User.countDocuments({ ...nonStockTestUser, kycStatus: "pending", role: "farmer" }),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({}),
      countLinkedOrdersByStatus(),
      Order.aggregate([
        ...LINKED_ORDER_STAGES,
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            platformFeeTotal: { $sum: "$platformFee" },
          },
        },
      ]),
      Review.countDocuments({ isApproved: false }),
      Withdrawal.countDocuments({
        status: { $in: ["pending", "processing"] },
      }),
      SupportTicket.countDocuments({
        status: { $in: ["open", "in_progress"] },
      }),
    ]);

    const orderStatusBreakdown = linkedOrderStatus.breakdown;
    const totalOrders = linkedOrderStatus.totalOrders;
    const deliveredOrders = orderStatusBreakdown.delivered;

    const totalRevenue = revenueAgg[0]?.total || 0;
    const platformFeeTotal = revenueAgg[0]?.platformFeeTotal || 0;
    const adminFeePercent =
      totalRevenue > 0 ? Math.round((platformFeeTotal / totalRevenue) * 1000) / 10 : 0;

    return res.json({
      stats: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        pendingKYC,
        activeListings,
        totalProducts,
        totalOrders,
        deliveredOrders,
        orderStatusBreakdown,
        totalRevenue,
        platformFeeTotal,
        adminFeePercent,
        pendingReviews,
        pendingWithdrawals,
        openSupportTickets,
      },
    });
  } catch (err) {
    console.error("Admin getStats error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching admin stats",
    });
  }
};

const OVERVIEW_MONTHS = 6;

function formatCategoryLabel(cat) {
  if (!cat) return "Other";
  return String(cat)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// GET /api/admin/analytics/overview
// Last N calendar months: linked orders only (buyer + farmer users exist) — count by placed date; revenue = paid linked subtotals. Plus user signups and product categories.
exports.getOverviewAnalytics = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const now = new Date();
    const monthlyBuckets = [];
    for (let i = OVERVIEW_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      monthlyBuckets.push({
        key: `${y}-${String(m).padStart(2, "0")}`,
        label: d.toLocaleString("en-IN", { month: "short" }),
        year: y,
        month: m,
      });
    }

    const [orderAgg, userAgg, categoryAgg] = await Promise.all([
      Order.aggregate([
        ...LINKED_ORDER_STAGES,
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
      ]),
      Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const orderMap = new Map();
    for (const row of orderAgg) {
      if (!row._id) continue;
      const k = `${row._id.y}-${String(row._id.m).padStart(2, "0")}`;
      orderMap.set(k, {
        orders: row.orders,
        revenue: Math.round(row.revenue || 0),
      });
    }

    const userMap = new Map();
    for (const row of userAgg) {
      if (!row._id) continue;
      const k = `${row._id.y}-${String(row._id.m).padStart(2, "0")}`;
      userMap.set(k, row.users);
    }

    const monthly = monthlyBuckets.map((b) => {
      const o = orderMap.get(b.key) || { orders: 0, revenue: 0 };
      return {
        key: b.key,
        label: b.label,
        name: b.label,
        orders: o.orders,
        revenue: o.revenue,
        users: userMap.get(b.key) || 0,
      };
    });

    const categoryColors = [
      "hsl(var(--primary))",
      "hsl(var(--secondary))",
      "hsl(var(--accent))",
      "hsl(var(--warning))",
      "hsl(var(--muted))",
      "hsl(199 89% 48%)",
      "hsl(280 60% 50%)",
    ];

    const categories = categoryAgg.map((c, i) => {
      const id = c._id != null ? String(c._id) : "other";
      return {
        category: id,
        count: c.count,
        value: c.count,
        name: formatCategoryLabel(id),
        color: categoryColors[i % categoryColors.length],
      };
    });

    return res.json({ monthly, categories });
  } catch (err) {
    console.error("Admin getOverviewAnalytics error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching overview analytics",
    });
  }
};

// GET /api/admin/users
// Pagination: pass `limit` (and optional `skip`) to get { users, total, skip, limit }.
// Omit `limit` to return all matches (legacy).
exports.getUsers = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { role, kycStatus, search } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (kycStatus) {
      filter.kycStatus = kycStatus;
    }
    if (search && String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    // Always exclude StockTest accounts from admin user lists (and totals).
    // This keeps pagination + counts consistent with what is displayed in the UI.
    const stockTestNameRe = /^StockTest\s+(Buyer\s+[AB]|Farmer)\b/i;
    filter.$and = [...(filter.$and || []), { name: { $not: stockTestNameRe } }];

    const q = User.find(filter).select("-password").sort({ createdAt: -1 });

    const rawLimit = req.query.limit;
    const usePagination =
      rawLimit !== undefined && rawLimit !== null && String(rawLimit).trim() !== "";

    const wantStats =
      usePagination
        ? req.query.includeStats !== "false" && req.query.includeStats !== "0"
        : req.query.includeStats === "true" || req.query.includeStats === "1";

    if (usePagination) {
      const limitNum = Math.min(100, Math.max(1, Number(rawLimit) || 30));
      const skipNum = Math.max(0, Number(req.query.skip) || 0);
      const [total, usersRaw] = await Promise.all([
        User.countDocuments(filter),
        q.clone().skip(skipNum).limit(limitNum).lean(),
      ]);
      const users = wantStats ? await attachAdminUserStats(usersRaw) : usersRaw;
      return res.json({
        users,
        total,
        skip: skipNum,
        limit: limitNum,
      });
    }

    const usersRaw = await q.lean();
    const users = wantStats ? await attachAdminUserStats(usersRaw) : usersRaw;
    return res.json({ users });
  } catch (err) {
    console.error("Admin getUsers error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching users",
    });
  }
};

// PATCH /api/admin/users/:id
// body: { accountStatus?: 'active' | 'suspended', emailVerified?: boolean }
exports.patchUser = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { accountStatus, emailVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (accountStatus === "suspended" && user.role === "admin") {
      return res.status(400).json({ message: "Cannot suspend an admin account" });
    }

    if (accountStatus === "active" || accountStatus === "suspended") {
      user.accountStatus = accountStatus;
    }

    if (typeof emailVerified === "boolean") {
      user.emailVerified = emailVerified;
    }

    await user.save();

    const detailPatch = {};
    if (accountStatus === "active" || accountStatus === "suspended") {
      detailPatch.accountStatus = user.accountStatus;
    }
    if (typeof emailVerified === "boolean") {
      detailPatch.emailVerified = user.emailVerified;
    }
    if (Object.keys(detailPatch).length > 0) {
      logAudit(req, {
        action: "user.patch",
        resourceType: "user",
        resourceId: String(user._id),
        targetUserId: user._id,
        details: detailPatch,
      });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Admin patchUser error:", err);
    return res.status(500).json({
      message: err.message || "Server error while updating user",
    });
  }
};

// POST /api/admin/users/:id/send-password-reset
exports.sendPasswordResetEmail = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const crypto = require("crypto");
    const { sendMail, isMailConfigured } = require("../utils/mail");

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const email = (user.email && String(user.email).trim()) || "";
    if (!email) {
      return res.status(400).json({
        message: "User has no email on file; cannot send a reset link.",
      });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({
        message:
          "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optional SMTP_PORT, SMTP_FROM, FRONTEND_URL) on the server.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const base =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:8080";
    const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
      resetToken
    )}`;

    await sendMail({
      to: email,
      subject: "Reset your Farm platform password",
      text: `You are receiving this because an administrator requested a password reset for your account.\n\nOpen this link to choose a new password (valid 24 hours):\n${resetUrl}\n\nIf you did not expect this, you can ignore this email.`,
    });

    logAudit(req, {
      action: "user.password_reset_email",
      resourceType: "user",
      resourceId: String(user._id),
      targetUserId: user._id,
      details: { email },
    });

    return res.json({ message: "Password reset email sent." });
  } catch (err) {
    if (err.code === "MAIL_NOT_CONFIGURED") {
      return res.status(503).json({ message: err.message });
    }
    console.error("Admin sendPasswordResetEmail error:", err);
    return res.status(500).json({
      message: err.message || "Server error while sending email",
    });
  }
};

// GET /api/admin/reviews?skip=&limit=&isApproved=true|false
exports.listReviews = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const skipNum = Math.max(0, Number(req.query.skip) || 0);
    const filter = {};
    const ap = req.query.isApproved;
    if (ap === "true") filter.isApproved = true;
    else if (ap === "false") filter.isApproved = false;

    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .populate("product", "name")
        .populate("reviewer", "name")
        .populate("target", "name")
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum),
    ]);

    return res.json({
      reviews,
      total,
      skip: skipNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Admin listReviews error:", err);
    return res.status(500).json({
      message: err.message || "Server error while listing reviews",
    });
  }
};

// POST /api/admin/users/:id/approve-kyc
exports.approveKYC = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploaded = new Set((user.kycDocuments || []).map((d) => d.docType));
    const hasAadhaar = uploaded.has("aadhaar");
    const hasKisan = uploaded.has("kisan");
    if (!hasAadhaar && !hasKisan) {
      return res.status(400).json({
        message:
          "Cannot approve: upload at least one of Aadhaar card or Kisan ID (bank statement is not required).",
      });
    }

    user.kycStatus = "approved";
    user.kycRejectionReason = undefined;
    for (const doc of user.kycDocuments || []) {
      doc.reviewStatus = "approved";
    }
    await user.save();

    // Notify user
    try {
      await createNotificationIfAllowed(Notification, {
        userId: user._id,
        type: "system",
        title: "KYC approved",
        message: "Your KYC has been approved. You can now fully use the platform.",
        link: "/farmer/profile",
      });
    } catch {
      // ignore notification errors
    }

    logAudit(req, {
      action: "kyc.approve",
      resourceType: "user",
      resourceId: String(user._id),
      targetUserId: user._id,
      details: { farmerName: user.name },
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Admin approveKYC error:", err);
    return res.status(500).json({
      message: err.message || "Server error while approving KYC",
    });
  }
};

// POST /api/admin/users/:id/reject-kyc
// body: { reason?: string }
exports.rejectKYC = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const rawReason = req.body?.reason ?? req.body?.rejectionReason;
    const reason =
      rawReason != null && String(rawReason).trim()
        ? String(rawReason).trim().slice(0, 2000)
        : "";

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.kycStatus = "rejected";
    user.kycRejectionReason = reason || undefined;
    for (const doc of user.kycDocuments || []) {
      doc.reviewStatus = "rejected";
    }
    await user.save();

    const notifyMessage = reason
      ? `Your KYC has been rejected. Reason: ${reason}. Please upload updated documents from your profile.`
      : "Your KYC has been rejected. Please upload updated documents from your profile.";

    try {
      await createNotificationIfAllowed(Notification, {
        userId: user._id,
        type: "system",
        title: "KYC rejected",
        message: notifyMessage,
        link: "/farmer/profile",
      });
    } catch {
      // ignore notification errors
    }

    logAudit(req, {
      action: "kyc.reject",
      resourceType: "user",
      resourceId: String(user._id),
      targetUserId: user._id,
      details: { farmerName: user.name, reason: reason || undefined },
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Admin rejectKYC error:", err);
    return res.status(500).json({
      message: err.message || "Server error while rejecting KYC",
    });
  }
};

// POST /api/admin/listings/:id/moderate
// action: 'suspend' | 'activate' | 'remove'
exports.moderateListing = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { action } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (action === "remove") {
      const farmerId = product.farmer;
      const productName = product.name;
      const pid = String(product._id);
      await product.deleteOne();

      try {
        await createNotificationIfAllowed(Notification, {
          userId: farmerId,
          type: "system",
          title: "Listing removed by admin",
          message: "One of your listings has been removed by the admin.",
          link: "/farmer/listings",
        });
      } catch {
        // ignore notification errors
      }

      logAudit(req, {
        action: "listing.remove",
        resourceType: "product",
        resourceId: pid,
        targetUserId: farmerId,
        details: { productName },
      });

      return res.json({ message: "Product removed successfully" });
    }

    if (action === "suspend") {
      product.status = "hidden";
      await product.save();

      try {
        await createNotificationIfAllowed(Notification, {
          userId: product.farmer,
          type: "system",
          title: "Listing suspended",
          message: "One of your listings has been suspended by the admin.",
          link: "/farmer/listings",
        });
      } catch {
        // ignore notification errors
      }

      logAudit(req, {
        action: "listing.suspend",
        resourceType: "product",
        resourceId: String(product._id),
        targetUserId: product.farmer,
        details: { productName: product.name },
      });

      return res.json({ product });
    }

    if (action === "activate") {
      product.status = "active";
      await product.save();

      try {
        await createNotificationIfAllowed(Notification, {
          userId: product.farmer,
          type: "system",
          title: "Listing activated",
          message: "One of your listings has been reactivated by the admin.",
          link: "/farmer/listings",
        });
      } catch {
        // ignore notification errors
      }

      logAudit(req, {
        action: "listing.activate",
        resourceType: "product",
        resourceId: String(product._id),
        targetUserId: product.farmer,
        details: { productName: product.name },
      });

      return res.json({ product });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("Admin moderateListing error:", err);
    return res.status(500).json({
      message: err.message || "Server error while moderating listing",
    });
  }
};

// POST /api/admin/reviews/:id/moderate
// action: 'approve' | 'remove'
exports.moderateReview = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { action } = req.body;

    const review = await Review.findById(id)
      .populate("product", "name")
      .populate("reviewer", "name");
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (action === "remove") {
      const reviewerId = review.reviewer;
      const productName = review.product?.name || "a product";
      const rid = String(review._id);
      const ratingSnapshot = review.rating;
      await review.deleteOne();
      try {
        await createNotificationIfAllowed(Notification, {
          userId: reviewerId?._id || reviewerId,
          type: "review",
          title: "Review removed",
          message: `Your review for ${productName} was removed by a moderator.`,
          link: "/buyer/reviews",
        });
      } catch {
        // ignore notification errors
      }

      logAudit(req, {
        action: "review.remove",
        resourceType: "review",
        resourceId: rid,
        targetUserId: reviewerId?._id || reviewerId,
        details: { productName, rating: ratingSnapshot },
      });

      return res.json({ message: "Review removed successfully" });
    }

    if (action === "approve") {
      const wasApproved = review.isApproved === true;
      review.isApproved = true;
      await review.save();
      if (!wasApproved) {
        const productName = review.product?.name || "a product";
        const buyerName = review.reviewer?.name || "A buyer";
        const r = Math.min(5, Math.max(1, Number(review.rating)));
        try {
          await createNotificationIfAllowed(Notification, {
            userId: review.reviewer._id || review.reviewer,
            type: "review",
            title: "Review approved",
            message: `Your review for ${productName} is now visible on the platform.`,
            link: "/buyer/reviews",
          });
        } catch {
          // ignore notification errors
        }
        try {
          await createNotificationIfAllowed(Notification, {
            userId: review.target,
            type: "review",
            title: "New review published",
            message: `${buyerName} left ${r}/5 stars for ${productName}. It is now visible on your profile.`,
            link: "/farmer/reviews",
          });
        } catch {
          // ignore notification errors
        }
      }

      if (!wasApproved) {
        logAudit(req, {
          action: "review.approve",
          resourceType: "review",
          resourceId: String(review._id),
          targetUserId: review.reviewer?._id || review.reviewer,
          details: {
            productName: review.product?.name,
            rating: review.rating,
          },
        });
      }

      return res.json({ review });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("Admin moderateReview error:", err);
    return res.status(500).json({
      message: err.message || "Server error while moderating review",
    });
  }
};

// GET /api/admin/withdrawals/export.csv?status=optional
exports.exportWithdrawalsCsv = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const list = await Withdrawal.find(filter)
      .populate("farmer", "name phone email")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const { rowsToCsv, withUtf8Bom } = require("../utils/csv");
    const header = [
      "id",
      "farmerId",
      "farmerName",
      "farmerPhone",
      "farmerEmail",
      "amount",
      "status",
      "bankName",
      "accountNumber",
      "ifscCode",
      "accountHolderName",
      "requestedAt",
      "processedAt",
      "rejectionReason",
    ];
    const rows = [header];

    for (const w of list) {
      const f = w.farmer;
      rows.push([
        String(w._id),
        f?._id ? String(f._id) : String(w.farmer),
        f?.name || "",
        f?.phone || "",
        f?.email || "",
        String(w.amount ?? ""),
        w.status || "",
        w.bankName || "",
        w.accountNumber || "",
        w.ifscCode || "",
        w.accountHolderName || "",
        w.createdAt ? new Date(w.createdAt).toISOString() : "",
        w.processedAt ? new Date(w.processedAt).toISOString() : "",
        w.rejectionReason || "",
      ]);
    }

    const body = withUtf8Bom(rowsToCsv(rows));
    const stamp = new Date().toISOString().slice(0, 10);
    const tag = status ? `withdrawals-${status}` : "withdrawals-all";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${tag}-${stamp}.csv"`);
    return res.send(body);
  } catch (err) {
    console.error("Admin exportWithdrawalsCsv error:", err);
    return res.status(500).json({
      message: err.message || "Server error while exporting withdrawals",
    });
  }
};

// GET /api/admin/withdrawals?status=pending|processing|completed|rejected&skip=&limit=
exports.listWithdrawals = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const limitNum = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skipNum = Math.max(0, Number(req.query.skip) || 0);

    const [total, list] = await Promise.all([
      Withdrawal.countDocuments(filter),
      Withdrawal.find(filter)
        .populate("farmer", "name phone email")
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum),
    ]);

    return res.json({
      withdrawals: list.map((w) => buildAdminWithdrawal(w)),
      total,
      skip: skipNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Admin listWithdrawals error:", err);
    return res.status(500).json({
      message: err.message || "Server error while listing withdrawals",
    });
  }
};

// PATCH /api/admin/withdrawals/:id
// body: { status: 'processing' | 'completed' | 'rejected', rejectionReason?: string }
exports.updateWithdrawal = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const allowed = ["processing", "completed", "rejected"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        message: "status must be one of: processing, completed, rejected",
      });
    }

    const w = await Withdrawal.findById(id);
    if (!w) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    const previousStatus = w.status;

    if (w.status === "completed") {
      return res.status(400).json({ message: "Withdrawal is already completed" });
    }
    if (w.status === "rejected") {
      return res.status(400).json({ message: "Withdrawal was rejected and cannot be changed" });
    }

    w.status = status;
    if (status === "completed" || status === "rejected") {
      w.processedAt = new Date();
    }
    if (status === "rejected") {
      w.rejectionReason = (rejectionReason && String(rejectionReason).trim()) || "Rejected by admin";
    } else if (status === "completed") {
      w.rejectionReason = undefined;
    }

    await w.save();

    const farmerId = w.farmer;
    try {
      let title = "Withdrawal update";
      let message = `Your withdrawal request of ₹${w.amount.toLocaleString("en-IN")} has been updated.`;
      if (status === "processing") {
        title = "Withdrawal processing";
        message = `Your withdrawal of ₹${w.amount.toLocaleString("en-IN")} is being processed.`;
      } else if (status === "completed") {
        title = "Withdrawal completed";
        message = `₹${w.amount.toLocaleString("en-IN")} has been marked as paid out to your bank.`;
      } else if (status === "rejected") {
        title = "Withdrawal rejected";
        message = w.rejectionReason
          ? `Your withdrawal was rejected: ${w.rejectionReason}`
          : "Your withdrawal request was rejected.";
      }
      await createNotificationIfAllowed(Notification, {
        userId: farmerId,
        type: "system",
        title,
        message,
        link: "/farmer/earnings",
      });
    } catch {
      // ignore notification errors
    }

    const populated = await Withdrawal.findById(w._id).populate(
      "farmer",
      "name phone email"
    );

    logAudit(req, {
      action: "withdrawal.update",
      resourceType: "withdrawal",
      resourceId: String(w._id),
      targetUserId: w.farmer,
      details: {
        status,
        previousStatus,
        amount: w.amount,
        rejectionReason: status === "rejected" ? w.rejectionReason : undefined,
      },
    });

    return res.json({ withdrawal: buildAdminWithdrawal(populated) });
  } catch (err) {
    console.error("Admin updateWithdrawal error:", err);
    return res.status(500).json({
      message: err.message || "Server error while updating withdrawal",
    });
  }
};

// GET /api/admin/audit-logs?skip=&limit=&action=&resourceType=&actionSearch=
// action: exact match. actionSearch: case-insensitive substring (only if action is not set).
exports.listAuditLogs = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
    const skipNum = Math.max(0, Number(req.query.skip) || 0);
    const filter = {};
    const actionExact = req.query.action && String(req.query.action).trim();
    if (actionExact) {
      filter.action = String(req.query.action).trim();
    } else {
      const rawSearch = req.query.actionSearch && String(req.query.actionSearch).trim();
      if (rawSearch) {
        const q = escapeRegExp(rawSearch.slice(0, 100));
        if (q) filter.action = { $regex: q, $options: "i" };
      }
    }
    if (req.query.resourceType && String(req.query.resourceType).trim()) {
      filter.resourceType = String(req.query.resourceType).trim();
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .populate("actor", "name email role")
        .populate("targetUserId", "name email")
        .lean(),
    ]);

    const entries = logs.map((L) => ({
      id: String(L._id),
      createdAt: L.createdAt,
      action: L.action,
      resourceType: L.resourceType,
      resourceId: L.resourceId,
      details: L.details && typeof L.details === "object" ? L.details : {},
      actor: L.actor
        ? {
            id: String(L.actor._id),
            name: L.actor.name,
            email: L.actor.email,
            role: L.actor.role,
          }
        : null,
      targetUser: L.targetUserId
        ? {
            id: String(L.targetUserId._id),
            name: L.targetUserId.name,
            email: L.targetUserId.email,
          }
        : null,
    }));

    return res.json({
      entries,
      total,
      skip: skipNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Admin listAuditLogs error:", err);
    return res.status(500).json({
      message: err.message || "Server error while listing audit logs",
    });
  }
};

// GET /api/admin/support-tickets?skip=&limit=&status=&search=
exports.listSupportTickets = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const skipNum = Math.max(0, Number(req.query.skip) || 0);
    const statusFilter = req.query.status && String(req.query.status).trim();
    const search = req.query.search && String(req.query.search).trim();

    const filter = {};
    if (statusFilter && ["open", "in_progress", "resolved", "closed"].includes(statusFilter)) {
      filter.status = statusFilter;
    }
    if (search) {
      const q = escapeRegExp(search.slice(0, 120));
      if (q) {
        filter.$or = [
          { subject: { $regex: q, $options: "i" } },
          { message: { $regex: q, $options: "i" } },
        ];
      }
    }

    const [total, docs] = await Promise.all([
      SupportTicket.countDocuments(filter),
      SupportTicket.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .populate("user", "name email phone role")
        .lean(),
    ]);

    const tickets = docs.map((d) => serializeSupportTicketForApi(d, { listMode: true }));
    return res.json({ tickets, total, skip: skipNum, limit: limitNum });
  } catch (err) {
    console.error("Admin listSupportTickets error:", err);
    return res.status(500).json({ message: err.message || "Server error while listing support tickets" });
  }
};

// GET /api/admin/support-tickets/:id
exports.getSupportTicket = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const t = await SupportTicket.findById(req.params.id).populate("user", "name email phone role").lean();
    if (!t) return res.status(404).json({ message: "Ticket not found" });
    return res.json({ ticket: serializeSupportTicketForApi(t) });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ticket id" });
    }
    console.error("Admin getSupportTicket error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// PATCH /api/admin/support-tickets/:id  body: { status }
exports.patchSupportTicket = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const status = req.body?.status && String(req.body.status).trim();
    if (!status || !["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const prev = ticket.status;
    ticket.status = status;
    await ticket.save();

    logAudit(req, {
      action: "support_ticket_status",
      resourceType: "support_ticket",
      resourceId: String(ticket._id),
      targetUserId: ticket.user || undefined,
      details: { from: prev, to: status },
    });

    const populated = await SupportTicket.findById(ticket._id).populate("user", "name email phone role").lean();
    return res.json({ ticket: serializeSupportTicketForApi(populated) });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ticket id" });
    }
    console.error("Admin patchSupportTicket error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// POST /api/admin/support-tickets/:id/reply  body: { message }
exports.replySupportTicket = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const body = String(req.body?.message || "").trim();
    if (!body) return res.status(400).json({ message: "Message is required" });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const adminUser = await User.findById(req.user.id).select("name").lean();
    const authorName = adminUser?.name ? `${adminUser.name} (Admin)` : "Admin";

    ticket.replies.push({ fromRole: "admin", body, authorName });
    ticket.lastReplyAt = new Date();
    if (ticket.status === "open") ticket.status = "in_progress";
    await ticket.save();

    logAudit(req, {
      action: "support_ticket_reply",
      resourceType: "support_ticket",
      resourceId: String(ticket._id),
      targetUserId: ticket.user || undefined,
      details: { preview: body.slice(0, 200) },
    });

    const populated = await SupportTicket.findById(ticket._id).populate("user", "name email phone role").lean();

    const userEmail =
      populated.user && populated.user.email ? populated.user.email : populated.guestEmail;
    if (userEmail && isMailConfigured()) {
      const notifySubject = `Re: ${ticket.subject} — GaonBazaar support`;
      const notifyText = [
        `Hello${populated.user?.name ? ` ${populated.user.name}` : ""},`,
        "",
        "Our team replied to your support ticket:",
        "",
        body,
        "",
        `Ticket reference: ${String(ticket._id)}`,
        "",
        "— GaonBazaar",
      ].join("\n");
      sendMail({ to: userEmail, subject: notifySubject, text: notifyText }).catch((e) =>
        console.error("Admin reply user email failed:", e?.message || e)
      );
    }

    return res.json({ ticket: serializeSupportTicketForApi(populated) });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ticket id" });
    }
    console.error("Admin replySupportTicket error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// POST /api/admin/notifications/broadcast
// body: { audience: 'all_farmers'|'all_buyers'|'user', recipientUserId?: string, title: string, message: string, link?: string }
exports.broadcastNotifications = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const safeTrim = (v) => String(v || "").trim();
    const title = safeTrim(req.body?.title);
    const message = safeTrim(req.body?.message);
    const link = safeTrim(req.body?.link);
    const audience = safeTrim(req.body?.audience);
    const recipientUserId = safeTrim(req.body?.recipientUserId);

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    if (!audience || !["all_farmers", "all_buyers", "user"].includes(audience)) {
      return res.status(400).json({ message: "Valid audience is required" });
    }

    if (title.length > 220) {
      return res.status(400).json({ message: "Title is too long" });
    }
    if (message.length > 8000) {
      return res.status(400).json({ message: "Message is too long" });
    }
    if (link && link.length > 2000) {
      return res.status(400).json({ message: "Link is too long" });
    }

    // Keep notification type stable for dashboard announcements.
    const type = "system";

    const stockTestNameRe = /^StockTest\s+(Buyer\s+[AB]|Farmer)\b/i;
    const nonStockTestUser = { name: { $not: stockTestNameRe } };

    let userIds = [];

    if (audience === "user") {
      if (!recipientUserId) {
        return res.status(400).json({ message: "recipientUserId is required for audience 'user'" });
      }
      const u = await User.findById(recipientUserId)
        .select("_id accountStatus role name")
        .lean();
      if (!u) return res.status(404).json({ message: "User not found" });
      if (u.accountStatus === "suspended") {
        return res.status(400).json({ message: "Cannot notify suspended user" });
      }
      if (String(u.name || "").match(stockTestNameRe)) {
        return res.status(400).json({ message: "Cannot notify test user" });
      }
      userIds = [String(u._id)];
    } else {
      const role = audience === "all_farmers" ? "farmer" : "buyer";
      const users = await User.find({
        ...nonStockTestUser,
        role,
        accountStatus: { $ne: "suspended" },
        $or: [
          { "notificationPreferences.promotionalEmails": true },
          { notificationPreferences: { $exists: false } },
        ],
      })
        .select("_id")
        .lean();
      userIds = users.map((u) => String(u._id));
    }

    if (userIds.length === 0) {
      return res.status(200).json({ message: "No recipients found", recipients: 0 });
    }

    // Insert in chunks to avoid huge payloads for large user bases.
    const chunkSize = 1000;
    let created = 0;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const docs = chunk.map((uid) => ({
        user: uid,
        type,
        title,
        message,
        link: link || undefined,
      }));
      await Notification.insertMany(docs, { ordered: false });
      created += docs.length;
    }

    logAudit(req, {
      action: "notifications.broadcast",
      resourceType: "notification_broadcast",
      resourceId: "broadcast",
      targetUserId: audience === "user" ? recipientUserId : undefined,
      details: {
        audience,
        recipients: created,
        title,
        link: link || null,
      },
    });

    return res.json({ message: "Notifications broadcasted", recipients: created });
  } catch (err) {
    console.error("broadcastNotifications error:", err);
    return res.status(500).json({
      message: err.message || "Server error while broadcasting notifications",
    });
  }
};

