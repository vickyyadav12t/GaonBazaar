const mongoose = require("mongoose");
const CropCalendarGuide = require("../models/CropCalendarGuide");
const User = require("../models/User");
const Product = require("../models/Product");
const { getActivityForMonth } = require("../utils/cropCalendarMonth");
const { logAudit } = require("../utils/auditLog");

const AGRO_QUERY_REGIONS = new Set(["north", "central", "south"]);

const ALLOWED_SEASONS = new Set(["spring", "summer", "monsoon", "winter"]);
const ALLOWED_CATEGORIES = new Set([
  "vegetables",
  "fruits",
  "grains",
  "pulses",
  "spices",
  "dairy",
  "other",
]);

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
}

function serializeEntry(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const region = o.region && String(o.region).trim() ? String(o.region).trim().toLowerCase() : "";
  return {
    id: o.slug,
    cropName: o.cropName,
    cropNameHindi: o.cropNameHindi,
    category: o.category,
    season: o.season,
    plantingMonths: o.plantingMonths || [],
    harvestingMonths: o.harvestingMonths || [],
    growingPeriod: o.growingPeriod,
    description: o.description,
    descriptionHindi: o.descriptionHindi,
    tips: o.tips || [],
    tipsHindi: o.tipsHindi || [],
    icon: o.icon || "🌾",
    region,
    referenceLinks: o.referenceLinks || [],
    isPublished: o.isPublished !== false,
    order: typeof o.order === "number" ? o.order : 0,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
  };
}

function serializeAdminEntry(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    ...serializeEntry(doc),
  };
}

// GET /api/calendar — public
exports.getPublicCalendar = async (req, res) => {
  try {
    const region = req.query.region ? String(req.query.region).toLowerCase().trim() : "";
    const q = { isPublished: true };
    let docs = await CropCalendarGuide.find(q).sort({ order: 1, cropName: 1 }).lean();

    if (region && AGRO_QUERY_REGIONS.has(region)) {
      docs = docs.filter((d) => {
        const r = d.region && String(d.region).trim() ? String(d.region).trim().toLowerCase() : "";
        return !r || r === region;
      });
    }

    const entries = docs.map((d) => serializeEntry(d));
    let lastUpdated = null;
    for (const d of docs) {
      const t = d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
      if (!lastUpdated || t > lastUpdated) lastUpdated = t;
    }

    return res.json({
      meta: {
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        count: entries.length,
      },
      entries,
    });
  } catch (err) {
    console.error("getPublicCalendar error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// GET /api/calendar/farmer-context?month=1-12 — optional auth; farmers get category hints
exports.getFarmerContext = async (req, res) => {
  try {
    const month = Number.parseInt(req.query.month, 10);
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Query month must be 1–12" });
    }

    if (!req.user || req.user.role !== "farmer") {
      return res.json({
        month,
        categories: [],
        source: "none",
        matchingCropIds: [],
      });
    }

    const uid = req.user.id;
    const user = await User.findById(uid).select("calendarHighlightCategories").lean();
    const fromProducts = await Product.distinct("category", {
      farmer: uid,
      status: "active",
    });
    const fromProfile = Array.isArray(user?.calendarHighlightCategories)
      ? user.calendarHighlightCategories.filter((c) => ALLOWED_CATEGORIES.has(c))
      : [];

    const categories = [...new Set([...fromProducts, ...fromProfile].filter(Boolean))];
    const source =
      fromProducts.length > 0 ? "listings" : fromProfile.length > 0 ? "profile" : "none";

    const guides = await CropCalendarGuide.find({ isPublished: true }).select(
      "slug category plantingMonths harvestingMonths"
    );
    const matchingCropIds = [];
    for (const g of guides) {
      if (!categories.includes(g.category)) continue;
      if (getActivityForMonth(g, month)) matchingCropIds.push(g.slug);
    }

    return res.json({
      month,
      categories,
      source,
      matchingCropIds,
    });
  } catch (err) {
    console.error("getFarmerContext error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// --- Admin (mounted under /api/admin/calendar) ---

exports.adminListEntries = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const docs = await CropCalendarGuide.find({}).sort({ order: 1, cropName: 1 }).lean();
    return res.json({
      entries: docs.map((d) => serializeAdminEntry(d)),
    });
  } catch (err) {
    console.error("adminListEntries error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

function validateBody(body, partial) {
  const errors = [];
  const slug = body.slug != null ? String(body.slug).trim().toLowerCase() : undefined;
  if (!partial && (!slug || !/^[a-z0-9-]{1,64}$/.test(slug))) {
    errors.push("slug: required, lowercase letters, numbers, hyphens (1–64 chars)");
  }
  if (!partial) {
    if (!body.cropName || !String(body.cropName).trim()) errors.push("cropName required");
    if (!body.category || !ALLOWED_CATEGORIES.has(body.category)) errors.push("category required and must be valid");
    if (!body.season || !ALLOWED_SEASONS.has(body.season)) errors.push("season required and must be valid");
    if (!Array.isArray(body.plantingMonths) || body.plantingMonths.length === 0) {
      errors.push("plantingMonths required (non-empty array)");
    }
    if (!Array.isArray(body.harvestingMonths) || body.harvestingMonths.length === 0) {
      errors.push("harvestingMonths required (non-empty array)");
    }
    if (body.growingPeriod == null || Number.isNaN(Number(body.growingPeriod))) {
      errors.push("growingPeriod required");
    }
    if (!body.description || !String(body.description).trim()) errors.push("description required");
  }
  if (partial && body.cropName !== undefined && !String(body.cropName).trim()) errors.push("cropName empty");
  if (body.category !== undefined && !ALLOWED_CATEGORIES.has(body.category)) errors.push("invalid category");
  if (body.season !== undefined && !ALLOWED_SEASONS.has(body.season)) errors.push("invalid season");
  if (body.region !== undefined) {
    const r = String(body.region || "").toLowerCase().trim();
    if (r && !["north", "central", "south"].includes(r)) errors.push("invalid region");
  }
  return errors;
}

exports.adminCreateEntry = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const errs = validateBody(req.body, false);
    if (errs.length) return res.status(400).json({ message: errs.join("; ") });

    const {
      slug,
      cropName,
      cropNameHindi,
      category,
      season,
      plantingMonths,
      harvestingMonths,
      growingPeriod,
      description,
      descriptionHindi,
      tips,
      tipsHindi,
      icon,
      region,
      referenceLinks,
      isPublished,
      order,
    } = req.body;

    const doc = await CropCalendarGuide.create({
      slug: String(slug).trim().toLowerCase(),
      cropName: String(cropName).trim(),
      cropNameHindi: String(cropNameHindi || cropName).trim(),
      category,
      season,
      plantingMonths: Array.isArray(plantingMonths) ? plantingMonths : [],
      harvestingMonths: Array.isArray(harvestingMonths) ? harvestingMonths : [],
      growingPeriod: Number(growingPeriod),
      description: String(description).trim(),
      descriptionHindi: String(descriptionHindi || description).trim(),
      tips: Array.isArray(tips) ? tips : [],
      tipsHindi: Array.isArray(tipsHindi) ? tipsHindi : [],
      icon: icon != null ? String(icon) : "🌾",
      region:
        region != null && String(region).trim()
          ? String(region).trim().toLowerCase()
          : "",
      referenceLinks: Array.isArray(referenceLinks) ? referenceLinks : [],
      isPublished: isPublished !== false,
      order: typeof order === "number" ? order : 0,
    });

    logAudit(req, {
      action: "calendar_guide.create",
      resourceType: "CropCalendarGuide",
      resourceId: doc.slug,
      details: { slug: doc.slug },
    });

    return res.status(201).json({ entry: serializeAdminEntry(doc) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    console.error("adminCreateEntry error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.adminUpdateEntry = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const existing = await CropCalendarGuide.findById(id);
    if (!existing) return res.status(404).json({ message: "Entry not found" });

    const errs = validateBody(req.body, true);
    if (errs.length) return res.status(400).json({ message: errs.join("; ") });

    const $set = {};
    const b = req.body;
    if (b.cropName !== undefined) $set.cropName = String(b.cropName).trim();
    if (b.cropNameHindi !== undefined) $set.cropNameHindi = String(b.cropNameHindi).trim();
    if (b.category !== undefined) $set.category = b.category;
    if (b.season !== undefined) $set.season = b.season;
    if (b.plantingMonths !== undefined) $set.plantingMonths = b.plantingMonths;
    if (b.harvestingMonths !== undefined) $set.harvestingMonths = b.harvestingMonths;
    if (b.growingPeriod !== undefined) $set.growingPeriod = Number(b.growingPeriod);
    if (b.description !== undefined) $set.description = String(b.description).trim();
    if (b.descriptionHindi !== undefined) $set.descriptionHindi = String(b.descriptionHindi).trim();
    if (b.tips !== undefined) $set.tips = b.tips;
    if (b.tipsHindi !== undefined) $set.tipsHindi = b.tipsHindi;
    if (b.icon !== undefined) $set.icon = String(b.icon);
    if (b.region !== undefined) {
      $set.region =
        b.region != null && String(b.region).trim()
          ? String(b.region).trim().toLowerCase()
          : "";
    }
    if (b.referenceLinks !== undefined) $set.referenceLinks = b.referenceLinks;
    if (b.isPublished !== undefined) $set.isPublished = Boolean(b.isPublished);
    if (b.order !== undefined) $set.order = Number(b.order);
    if (b.slug !== undefined) {
      const s = String(b.slug).trim().toLowerCase();
      if (!/^[a-z0-9-]{1,64}$/.test(s)) {
        return res.status(400).json({ message: "Invalid slug" });
      }
      $set.slug = s;
    }

    const doc = await CropCalendarGuide.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: "Entry not found" });

    logAudit(req, {
      action: "calendar_guide.update",
      resourceType: "CropCalendarGuide",
      resourceId: doc.slug,
      details: { id: String(doc._id) },
    });

    return res.json({ entry: serializeAdminEntry(doc) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    console.error("adminUpdateEntry error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.adminDeleteEntry = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const doc = await CropCalendarGuide.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Entry not found" });

    logAudit(req, {
      action: "calendar_guide.delete",
      resourceType: "CropCalendarGuide",
      resourceId: doc.slug,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteEntry error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
