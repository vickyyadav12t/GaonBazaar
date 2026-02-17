const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameHindi: { type: String },
    description: { type: String },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g. "kg", "quintal"
    availableQuantity: { type: Number, required: true },
    minOrderQuantity: { type: Number, default: 1 },
    harvestDate: { type: Date },
    images: [{ type: String }],
    isOrganic: { type: Boolean, default: false },
    isNegotiable: { type: Boolean, default: false },
    views: { type: Number, default: 0 },

    // Farmer reference
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);

