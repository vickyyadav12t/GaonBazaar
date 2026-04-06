const Chat = require("../models/Chat");

/**
 * Requires body.chatId; verifies JWT user is buyer or farmer on that chat.
 * Sets req.fairDealContext = { role, product: { name, nameHindi, category, unit, price, isNegotiable } }
 */
module.exports = async function attachFairDealChat(req, res, next) {
  try {
    const chatId =
      req.body?.chatId != null ? String(req.body.chatId).trim() : "";
    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    const chat = await Chat.findById(chatId)
      .select("buyer farmer product")
      .populate("product", "name nameHindi category unit price isNegotiable")
      .lean();

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const uid = String(req.user.id);
    const buyerId = String(chat.buyer?._id || chat.buyer || "");
    const farmerId = String(chat.farmer?._id || chat.farmer || "");
    if (uid !== buyerId && uid !== farmerId) {
      return res.status(403).json({ message: "You are not part of this chat" });
    }

    const prod = chat.product || {};
    req.fairDealContext = {
      role: req.user.role,
      product: {
        name: prod.name || "Produce",
        nameHindi: prod.nameHindi || "",
        category: prod.category || "other",
        unit: prod.unit || "kg",
        price: Number(prod.price) || 0,
        isNegotiable: !!prod.isNegotiable,
      },
    };
    next();
  } catch (e) {
    console.error("attachFairDealChat error:", e);
    return res.status(500).json({ message: "Could not load chat context" });
  }
};
