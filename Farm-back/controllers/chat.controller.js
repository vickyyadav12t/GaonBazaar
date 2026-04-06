const Chat = require("../models/Chat");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendMail, isMailConfigured } = require("../utils/mail");
const { prefsFromDoc, loadPrefs, createNotificationIfAllowed } = require("../utils/notificationDispatch");

function getFrontendBaseUrl(req) {
  const base =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    (req?.headers?.origin ? String(req.headers.origin) : "") ||
    "http://localhost:8080";
  return base.replace(/\/$/, "");
}

async function maybeEmailFarmer(chatDoc, req, opts) {
  try {
    if (!isMailConfigured()) return;
    const now = Date.now();
    const last = chatDoc.lastFarmerEmailNotifiedAt
      ? new Date(chatDoc.lastFarmerEmailNotifiedAt).getTime()
      : 0;
    const cooldownMs = Number(process.env.NEGOTIATION_EMAIL_COOLDOWN_MS) || 10 * 60 * 1000;
    if (last && now - last < cooldownMs) return;

    const farmerId = getEntityId(chatDoc.farmer);
    const buyerId = getEntityId(chatDoc.buyer);
    if (!farmerId || !buyerId) return;

    const [farmer, buyer, product] = await Promise.all([
      User.findById(farmerId).select("name email notificationPreferences").lean(),
      User.findById(buyerId).select("name").lean(),
      Product.findById(chatDoc.product).select("name unit price").lean(),
    ]);

    if (!farmer?.email || !prefsFromDoc(farmer).emailNotifications) return;
    const appName = process.env.APP_NAME || "GaonBazaar";
    const productName = product?.name || "your listing";
    const buyerName = buyer?.name || "A buyer";
    const baseUrl = getFrontendBaseUrl(req);
    const chatUrl = `${baseUrl}/chat/${String(chatDoc._id)}`;

    const subject =
      opts.kind === "started"
        ? `${appName} — new negotiation request`
        : opts.kind === "offer"
          ? `${appName} — new price offer`
          : `${appName} — new message`;

    const headline =
      opts.kind === "started"
        ? `${buyerName} wants to negotiate on ${productName}.`
        : opts.kind === "offer"
          ? `${buyerName} sent a price offer on ${productName}.`
          : `${buyerName} sent a message about ${productName}.`;

    const detailLines = [];
    if (opts.offerPrice != null && Number.isFinite(Number(opts.offerPrice))) {
      detailLines.push(`Offer: ₹${Number(opts.offerPrice).toLocaleString("en-IN")} per ${product?.unit || "unit"}`);
    }
    detailLines.push(`Original: ₹${Number(chatDoc.originalPrice || product?.price || 0).toLocaleString("en-IN")} per ${product?.unit || "unit"}`);

    await sendMail({
      to: farmer.email,
      subject,
      text: `${headline}\n\n${detailLines.join("\n")}\n\nOpen chat: ${chatUrl}\n\n— ${appName}`,
      html: `<p>${headline}</p><p>${detailLines.map((l) => l.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("<br/>")}</p><p><a href="${chatUrl}">Open chat</a></p><p>— ${appName}</p>`,
    });

    chatDoc.lastFarmerEmailNotifiedAt = new Date(now);
    await chatDoc.save();
  } catch (e) {
    console.error("Negotiation farmer email error:", e);
  }
}

const getEntityId = (entity) => {
  if (!entity) return null;
  if (typeof entity === "string") return entity;
  return entity._id || entity.id || null;
};

function truncateText(str, maxLen) {
  const t = String(str || "").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

/** Clear unread for the side that is opening the chat (buyer vs farmer). */
async function resetUnreadForViewer(chatDoc, userId) {
  const buyerId = getEntityId(chatDoc.buyer);
  const farmerId = getEntityId(chatDoc.farmer);
  let changed = false;
  if (String(userId) === String(buyerId) && (chatDoc.unreadCountBuyer || 0) > 0) {
    chatDoc.unreadCountBuyer = 0;
    changed = true;
  } else if (String(userId) === String(farmerId) && (chatDoc.unreadCountFarmer || 0) > 0) {
    chatDoc.unreadCountFarmer = 0;
    changed = true;
  }
  if (changed) await chatDoc.save();
}

const buildChatResponse = (chat, currentUserId) => {
  if (!chat) return null;
  const plain = chat.toObject ? chat.toObject() : chat;

  const product = plain.product || {};
  const farmer = plain.farmer || {};
  const buyer = plain.buyer || {};

  const unreadCount =
    String(currentUserId) === String(buyer._id || buyer.id)
      ? plain.unreadCountBuyer || 0
      : plain.unreadCountFarmer || 0;

  return {
    id: String(plain._id),
    productId: String(product._id || plain.product),
    productName: product.name || "",
    productImage:
      (product.images && product.images[0]) ||
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
    farmerId: String(farmer._id || plain.farmer),
    farmerName: farmer.name || "",
    buyerId: String(buyer._id || plain.buyer),
    buyerName: buyer.name || "",
    lastMessage: plain.lastMessage || "",
    lastMessageTime: plain.lastMessageTime
      ? plain.lastMessageTime.toISOString()
      : plain.updatedAt
      ? plain.updatedAt.toISOString()
      : new Date().toISOString(),
    unreadCount,
    negotiationStatus: plain.negotiationStatus || "ongoing",
    currentOffer: plain.currentOffer || null,
    originalPrice: plain.originalPrice,
    messages:
      plain.messages?.map((m) => ({
        id: String(m._id),
        senderId: String(m.sender),
        senderName:
          m.sender?.name ||
          (String(m.sender) === String(farmer._id || farmer.id)
            ? farmer.name
            : buyer.name) ||
          "",
        senderRole: m.senderRole || "buyer",
        receiverId: String(m.receiver),
        content: m.content,
        type: m.type || "text",
        offerPrice: m.offerPrice,
        timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString(),
        isRead: m.isRead || false,
      })) || [],
  };
};

const CHAT_LIST_MAX_LIMIT = 100;
const CHAT_LIST_DEFAULT_LIMIT = 30;

// GET /api/chats?limit=&skip=&includeTotal=true
// List chats where current user is buyer or farmer (admin: all)
exports.getChats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const filter =
      role === "admin"
        ? {}
        : {
            $or: [{ buyer: userId }, { farmer: userId }],
          };

    const limitNum = Math.min(
      CHAT_LIST_MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || CHAT_LIST_DEFAULT_LIMIT)
    );
    const skipNum = Math.max(0, Number(req.query.skip) || 0);
    let total;
    if (String(req.query.includeTotal || "").toLowerCase() === "true") {
      total = await Chat.countDocuments(filter);
    }

    const chats = await Chat.find(filter)
      .populate("product", "name images price unit")
      .populate("farmer", "name")
      .populate("buyer", "name")
      .sort({ updatedAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.json({
      chats: chats.map((c) => buildChatResponse(c, userId)),
      ...(typeof total === "number" ? { total } : {}),
      skip: skipNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Get chats error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching chats",
    });
  }
};

// GET /api/chats/:id
exports.getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const chat = await Chat.findById(id)
      .populate("product", "name images price unit")
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const buyerId = getEntityId(chat.buyer);
    const farmerId = getEntityId(chat.farmer);
    const isParticipant =
      String(buyerId) === String(userId) ||
      String(farmerId) === String(userId);

    if (!isParticipant && role !== "admin") {
      return res.status(403).json({ message: "Access denied to this chat" });
    }

    await resetUnreadForViewer(chat, userId);

    const refreshed = await Chat.findById(id)
      .populate("product", "name images price unit")
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    return res.json({ chat: buildChatResponse(refreshed || chat, userId) });
  } catch (err) {
    console.error("Get chat by id error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching chat",
    });
  }
};

// GET /api/chats/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const chat = await Chat.findById(id)
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const buyerId = getEntityId(chat.buyer);
    const farmerId = getEntityId(chat.farmer);
    const isParticipant =
      String(buyerId) === String(userId) ||
      String(farmerId) === String(userId);

    if (!isParticipant && role !== "admin") {
      return res.status(403).json({ message: "Access denied to this chat" });
    }

    await resetUnreadForViewer(chat, userId);

    const refreshed = await Chat.findById(id)
      .populate("product", "name images price unit")
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    const mapped = buildChatResponse(refreshed || chat, userId);
    return res.json({ messages: mapped.messages });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching messages",
    });
  }
};

// POST /api/chats
// Create or reuse a chat for a product between buyer and farmer
exports.createChat = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== "buyer") {
      return res
        .status(403)
        .json({ message: "Only buyers can start negotiations" });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById(productId).populate(
      "farmer",
      "name role"
    );
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    const farmerId = product.farmer._id;

    let chat = await Chat.findOne({
      product: product._id,
      buyer: userId,
      farmer: farmerId,
    })
      .populate("product", "name images price unit")
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    if (!chat) {
      chat = new Chat({
        product: product._id,
        farmer: farmerId,
        buyer: userId,
        originalPrice: product.price,
        lastMessage: "",
      });
      await chat.save();

      chat = await Chat.findById(chat._id)
        .populate("product", "name images price unit")
        .populate("farmer", "name role")
        .populate("buyer", "name role");
    }

    // If this is the first time this chat is created, email the farmer (best-effort, throttled).
    if (chat && chat.messages && chat.messages.length === 0) {
      void maybeEmailFarmer(chat, req, { kind: "started" });
    }

    return res.status(201).json({ chat: buildChatResponse(chat, userId) });
  } catch (err) {
    console.error("Create chat error:", err);
    return res.status(500).json({
      message: err.message || "Server error while creating chat",
    });
  }
};

// POST /api/chats/:id/messages
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { content, type, offerPrice } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Message content is required" });
    }

    const chat = await Chat.findById(id)
      .populate("product", "name images price unit")
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isParticipant =
      String(chat.buyer._id || chat.buyer) === String(userId) ||
      String(chat.farmer._id || chat.farmer) === String(userId);

    if (!isParticipant && role !== "admin") {
      return res.status(403).json({ message: "Access denied to this chat" });
    }

    const senderId = userId;
    const receiverId =
      String(senderId) === String(chat.buyer._id || chat.buyer)
        ? chat.farmer._id || chat.farmer
        : chat.buyer._id || chat.buyer;

    const message = {
      sender: senderId,
      receiver: receiverId,
      senderRole: role,
      content,
      type: type || "text",
      offerPrice,
    };

    chat.messages.push(message);
    chat.lastMessage = content;
    chat.lastMessageTime = new Date();

    // Update unread counts
    if (String(senderId) === String(chat.buyer._id || chat.buyer)) {
      chat.unreadCountFarmer = (chat.unreadCountFarmer || 0) + 1;
    } else {
      chat.unreadCountBuyer = (chat.unreadCountBuyer || 0) + 1;
    }

    // Update negotiation status and currentOffer based on message type
    if (message.type === "offer" || message.type === "counter_offer") {
      // Refresh list price from product (e.g. reorder after a past deal; listing may have changed)
      const listed = chat.product?.price;
      if (listed != null && Number.isFinite(Number(listed))) {
        chat.originalPrice = Number(listed);
      }
      chat.currentOffer = offerPrice;
      chat.negotiationStatus = "ongoing";
    } else if (message.type === "deal_accepted") {
      chat.negotiationStatus = "accepted";
    } else if (message.type === "deal_rejected") {
      chat.negotiationStatus = "rejected";
    }

    await chat.save();

    const productName =
      chat.product?.name || "a listing";
    const senderName =
      String(senderId) === String(chat.buyer._id || chat.buyer)
        ? chat.buyer?.name || "Buyer"
        : chat.farmer?.name || "Farmer";
    const receiverUserId = getEntityId(receiverId);

    // In-app notification + realtime hint for notification bell / chat lists
    let createdMessageNotif = null;
    try {
      if (receiverUserId) {
        createdMessageNotif = await createNotificationIfAllowed(Notification, {
          userId: receiverUserId,
          type: "message",
          title: `New message — ${productName}`,
          message: `${senderName}: ${truncateText(content, 140)}`,
          link: `/chat/${chat._id}`,
        });
      }
    } catch {
      // ignore notification errors
    }

    // Email farmer when buyer is messaging/offering (best-effort, throttled).
    try {
      const receiverIsFarmer = String(receiverUserId) === String(getEntityId(chat.farmer));
      const senderIsBuyer = String(senderId) === String(getEntityId(chat.buyer));
      if (receiverIsFarmer && senderIsBuyer) {
        const kind =
          message.type === "offer" || message.type === "counter_offer"
            ? "offer"
            : "message";
        void maybeEmailFarmer(chat, req, { kind, offerPrice: message.offerPrice });
      }
    } catch {
      // ignore email errors
    }

    const populated = await Chat.findById(chat._id)
      .populate("product", "name images price unit")
      .populate("farmer", "name role")
      .populate("buyer", "name role");

    try {
      const io = req.app.get("io");
      if (io) {
        if (receiverUserId && createdMessageNotif) {
          const pushOk = (await loadPrefs(receiverUserId)).pushNotifications;
          if (pushOk) {
            io.to(`user:${String(receiverUserId)}`).emit("notification:new", {
              scope: "message",
              chatId: String(chat._id),
            });
          }
        }
        io.to(`chat:${chat._id}`).emit("chat:updated", { chatId: String(chat._id) });
      }
    } catch {
      // ignore socket emit failures
    }

    return res.status(201).json({ chat: buildChatResponse(populated, userId) });
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({
      message: err.message || "Server error while sending message",
    });
  }
};

