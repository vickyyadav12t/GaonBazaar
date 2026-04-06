const mongoose = require("mongoose");

const referenceLinkSchema = new mongoose.Schema(
  {
    href: { type: String, required: true, trim: true },
    labelEn: { type: String, required: true, trim: true },
    labelHi: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const cropCalendarGuideSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    cropName: { type: String, required: true, trim: true },
    cropNameHindi: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    season: {
      type: String,
      enum: ["spring", "summer", "monsoon", "winter"],
      required: true,
    },
    plantingMonths: [{ type: Number, min: 1, max: 12 }],
    harvestingMonths: [{ type: Number, min: 1, max: 12 }],
    growingPeriod: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true },
    descriptionHindi: { type: String, required: true, trim: true },
    tips: [{ type: String, trim: true }],
    tipsHindi: [{ type: String, trim: true }],
    icon: { type: String, default: "🌾", trim: true },
    /** Omit or "" = all regions. north|central|south = entry scoped to that zone (see API + frontend). */
    region: { type: String, trim: true, default: "" },
    referenceLinks: { type: [referenceLinkSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropCalendarGuide", cropCalendarGuideSchema);
