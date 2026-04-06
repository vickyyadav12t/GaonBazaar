const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");
const { sendMail, isMailConfigured } = require("../utils/mail");

const SUPPORT_TO = "praj01012003@gmail.com";

function safeTrim(v) {
  return String(v || "").trim();
}

function isValidEmail(email) {
  const e = safeTrim(email).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function mapUserRef(u) {
  if (!u) return null;
  const id = u._id ? String(u._id) : String(u);
  if (typeof u === "object" && u.name !== undefined) {
    return {
      id,
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "",
    };
  }
  return { id, name: "", email: "", phone: "", role: "" };
}

function serializeTicketDoc(t, { listMode = false } = {}) {
  const plain = t.toObject ? t.toObject() : t;
  const allReplies = plain.replies || [];
  const replies = listMode
    ? []
    : allReplies.map((r) => ({
        id: String(r._id),
        fromRole: r.fromRole,
        body: r.body,
        authorName: r.authorName || "",
        createdAt: r.createdAt,
      }));
  return {
    id: String(plain._id),
    subject: plain.subject,
    message: plain.message,
    status: plain.status,
    guestEmail: plain.guestEmail || "",
    user: mapUserRef(plain.user),
    replies,
    replyCount: allReplies.length,
    emailNotified: !!plain.emailNotified,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    lastReplyAt: plain.lastReplyAt,
  };
}

// POST /api/support/tickets
// body: { subject, message, guestEmail? }
// Optional auth: links ticket to user when Bearer token present.
exports.submitTicket = async (req, res) => {
  try {
    const subject = safeTrim(req.body?.subject);
    const message = safeTrim(req.body?.message);
    let guestEmail = safeTrim(req.body?.guestEmail).toLowerCase();
    if (guestEmail && !isValidEmail(guestEmail)) {
      return res.status(400).json({ message: "Invalid guest email" });
    }

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const userId = req.user?.id || null;
    if (userId) guestEmail = "";

    const ticket = await SupportTicket.create({
      user: userId || undefined,
      guestEmail: guestEmail || "",
      subject,
      message,
      status: "open",
      emailNotified: false,
    });

    let userLine = "User: Guest";
    const metaLines = [];

    if (userId) {
      const u = await User.findById(userId).select("name email phone role").lean();
      if (u) {
        const phone = u.phone ? `, phone: ${u.phone}` : "";
        userLine = `User: ${u.name || "Unknown"} (role: ${u.role || req.user.role || "unknown"}, email: ${u.email || "n/a"}${phone})`;
      } else {
        userLine = `User: ${String(userId)} (role: ${req.user.role || "unknown"})`;
      }
    } else if (guestEmail) {
      userLine = `Guest email: ${guestEmail}`;
    }

    metaLines.push(userLine);
    metaLines.push(`Ticket ID: ${String(ticket._id)}`);
    metaLines.push(`Time: ${new Date().toISOString()}`);

    const text = [
      "New GaonBazaar Support Ticket",
      "",
      ...metaLines,
      "",
      `Subject: ${subject}`,
      "",
      message,
      "",
      "— GaonBazaar",
    ].join("\n");

    if (isMailConfigured()) {
      try {
        await sendMail({
          to: SUPPORT_TO,
          subject: `Support Ticket: ${subject}`,
          text,
        });
        ticket.emailNotified = true;
        await ticket.save();
      } catch (mailErr) {
        console.error("Support ticket email failed (ticket still saved):", mailErr?.message || mailErr);
      }
    }

    const populated = await SupportTicket.findById(ticket._id).populate("user", "name email phone role").lean();

    return res.status(201).json({
      message: "Ticket submitted",
      ticket: serializeTicketDoc(populated),
      emailNotificationSent: !!populated.emailNotified,
    });
  } catch (err) {
    console.error("Submit ticket error:", err);
    return res.status(500).json({ message: "Server error while submitting ticket" });
  }
};

// GET /api/support/tickets/my
exports.listMyTickets = async (req, res) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: "Authentication required" });

    const tickets = await SupportTicket.find({ user: uid })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const list = tickets.map((t) => serializeTicketDoc(t, { listMode: true }));
    return res.json({ tickets: list });
  } catch (err) {
    console.error("listMyTickets error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/support/tickets/:id
exports.getMyTicket = async (req, res) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: "Authentication required" });

    const t = await SupportTicket.findOne({
      _id: req.params.id,
      user: uid,
    })
      .populate("user", "name email phone role")
      .lean();

    if (!t) return res.status(404).json({ message: "Ticket not found" });

    return res.json({ ticket: serializeTicketDoc(t) });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ticket id" });
    }
    console.error("getMyTicket error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/support/tickets/:id/reply  body: { message }
exports.userReplyToTicket = async (req, res) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: "Authentication required" });

    const body = safeTrim(req.body?.message);
    if (!body) return res.status(400).json({ message: "Message is required" });

    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: uid });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "This ticket is closed" });
    }

    const u = await User.findById(uid).select("name").lean();
    const authorName = u?.name || "User";

    ticket.replies.push({
      fromRole: "user",
      body,
      authorName,
    });
    ticket.lastReplyAt = new Date();
    if (ticket.status === "resolved") ticket.status = "open";
    await ticket.save();

    const populated = await SupportTicket.findById(ticket._id).populate("user", "name email phone role").lean();

    if (isMailConfigured()) {
      const notifyText = [
        "GaonBazaar — user replied on support ticket",
        "",
        `Ticket ID: ${String(ticket._id)}`,
        `Subject: ${ticket.subject}`,
        "",
        body,
        "",
        "— GaonBazaar",
      ].join("\n");
      sendMail({
        to: SUPPORT_TO,
        subject: `Ticket reply: ${ticket.subject}`,
        text: notifyText,
      }).catch((e) => console.error("User reply notify mail failed:", e?.message || e));
    }

    return res.json({ ticket: serializeTicketDoc(populated) });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ticket id" });
    }
    console.error("userReplyToTicket error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/support/newsletter/subscribe
exports.subscribeNewsletter = async (req, res) => {
  try {
    const email = safeTrim(req.body?.email).toLowerCase();
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({
        message: "Email is not configured. Please try again later.",
      });
    }

    const userLine = req.user?.id
      ? `UserId: ${String(req.user.id)} (role: ${req.user.role || "unknown"})`
      : "User: Guest";

    const text = [
      "New GaonBazaar Newsletter Subscription",
      "",
      `Subscriber: ${email}`,
      userLine,
      `Time: ${new Date().toISOString()}`,
      "",
      "— GaonBazaar",
    ].join("\n");

    await sendMail({
      to: SUPPORT_TO,
      subject: "Newsletter subscription",
      text,
    });

    return res.json({ message: "Subscribed" });
  } catch (err) {
    console.error("Subscribe newsletter error:", err);
    return res.status(500).json({ message: "Server error while subscribing" });
  }
};

exports.serializeSupportTicketForApi = serializeTicketDoc;
