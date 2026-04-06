const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { getFarmerAvgRatingMap } = require("../utils/adminUserStats");

// Helper to build a consistent product payload
const buildProductResponse = (product) => {
  if (!product) return null;
  const plain = product.toObject ? product.toObject() : product;
  return plain;
};

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function truthyQuery(val) {
  return val === true || val === "true" || val === "1";
}

// GET /api/products
// Query:
//   mine=true — farmer-only own listings (all statuses for that farmer).
//   farmer=<ObjectId> — public filter: only products from that farmer (active/hidden rules still apply).
//   category, search (name / nameHindi / description), minPrice, maxPrice,
//   organic / isOrganic, negotiable / isNegotiable,
//   sort=newest|price_asc|price_desc|popular,
//   includeTotal=true — adds total count for the same filter (use on first page).
exports.getAllProducts = async (req, res) => {
  try {
    const limitRaw = req.query.limit;
    const skipRaw = req.query.skip;
    const mineParam = req.query.mine;

    const limitNum = Math.max(1, Math.min(Number(limitRaw) || 30, 100));
    const skipNum = Math.max(0, Number(skipRaw) || 0);

    const wantMine =
      mineParam === true ||
      mineParam === "true" ||
      mineParam === "1";

    const role = req.user?.role;
    const userId = req.user?.id;

    if (wantMine) {
      if (role !== "farmer" || !userId) {
        return res.status(403).json({
          message:
            "Only authenticated farmers can list their own products (mine=true)",
        });
      }
    }

    const {
      category,
      search,
      minPrice,
      maxPrice,
      organic,
      isOrganic,
      negotiable,
      isNegotiable,
      sort: sortParam,
      includeTotal,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = String(category);
    }

    const searchTrim = search != null ? String(search).trim() : "";
    if (searchTrim) {
      const q = escapeRegex(searchTrim);
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { nameHindi: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const minP = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : NaN;
    const maxP = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : NaN;
    const priceCond = {};
    if (Number.isFinite(minP)) priceCond.$gte = minP;
    if (Number.isFinite(maxP)) priceCond.$lte = maxP;
    if (Object.keys(priceCond).length) {
      filter.price = priceCond;
    }

    if (truthyQuery(organic) || truthyQuery(isOrganic)) {
      filter.isOrganic = true;
    }

    if (truthyQuery(negotiable) || truthyQuery(isNegotiable)) {
      filter.isNegotiable = true;
    }

    const farmerParam =
      req.query.farmer != null ? String(req.query.farmer).trim() : "";
    if (farmerParam && !wantMine && mongoose.Types.ObjectId.isValid(farmerParam)) {
      filter.farmer = new mongoose.Types.ObjectId(farmerParam);
    }

    if (wantMine) {
      filter.farmer = userId;
    }

    // Hide suspended listings from public/buyers.
    const visibilityFilter = (() => {
      if (wantMine && role === "farmer" && userId) {
        return {};
      }
      if (role === "admin") return {};
      if (role === "farmer" && userId) {
        return {
          $or: [{ status: { $ne: "hidden" } }, { farmer: userId }],
        };
      }
      return { status: { $ne: "hidden" } };
    })();

    const query =
      Object.keys(filter).length > 0
        ? { $and: [filter, visibilityFilter] }
        : visibilityFilter;

    let sortSpec = { createdAt: -1 };
    const sp = sortParam ? String(sortParam).toLowerCase() : "newest";
    if (sp === "price_asc" || sp === "price_low") {
      sortSpec = { price: 1, createdAt: -1 };
    } else if (sp === "price_desc" || sp === "price_high") {
      sortSpec = { price: -1, createdAt: -1 };
    } else if (sp === "popular" || sp === "rating" || sp === "views") {
      sortSpec = { views: -1, createdAt: -1 };
    }

    let total;
    if (truthyQuery(includeTotal) || includeTotal === "1") {
      total = await Product.countDocuments(query);
    }

    const products = await Product.find(query)
      .populate("farmer", "name location kycStatus phone email avatar")
      .sort(sortSpec)
      .skip(skipNum)
      .limit(limitNum);

    let productPayloads = products.map(buildProductResponse);

    if (productPayloads.length > 0) {
      const farmerIds = [
        ...new Set(
          products
            .map((p) => (p.farmer && p.farmer._id ? p.farmer._id : p.farmer))
            .filter(Boolean)
        ),
      ];
      const ratingMap = await getFarmerAvgRatingMap(farmerIds);
      productPayloads = productPayloads.map((plain, i) => {
        const p = products[i];
        const fid = p.farmer && p.farmer._id ? p.farmer._id : p.farmer;
        const key = fid ? String(fid) : "";
        return {
          ...plain,
          farmerAvgRating: key ? ratingMap.get(key) ?? null : null,
        };
      });
    }

    const payload = {
      products: productPayloads,
    };
    if (total !== undefined) {
      payload.total = total;
      payload.limit = limitNum;
      payload.skip = skipNum;
    }

    return res.json(payload);
  } catch (err) {
    console.error("Get all products error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching products",
    });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "farmer",
      "name location kycStatus phone email avatar"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Do not expose suspended listings to public/buyers.
    // Allow admin, or the owning farmer.
    if (product.status === "hidden") {
      const role = req.user?.role;
      const userId = req.user?.id;
      const ownerId = product.farmer?.toString?.() || product.farmer;

      const isAdmin = role === "admin";
      const isOwnerFarmer = role === "farmer" && userId && ownerId && ownerId.toString() === userId.toString();

      if (!isAdmin && !isOwnerFarmer) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    // Increment views (fire-and-forget)
    Product.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(() => {});

    const plain = buildProductResponse(product);
    const fid = product.farmer?._id || product.farmer;
    if (fid) {
      const ratingMap = await getFarmerAvgRatingMap([fid]);
      plain.farmerAvgRating = ratingMap.get(String(fid)) ?? null;
    }

    // Delivered orders that include this product (successful sales count for this listing).
    try {
      const successfulSalesCount = await Order.countDocuments({
        status: "delivered",
        "items.product": product._id,
      });
      plain.successfulSalesCount = successfulSalesCount;
    } catch {
      plain.successfulSalesCount = 0;
    }

    return res.json({ product: plain });
  } catch (err) {
    console.error("Get product by id error:", err);
    return res.status(500).json({
      message: err.message || "Server error while fetching product",
    });
  }
};

// POST /api/products
// Protected: farmer/admin only
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role } = req.user || {};

    if (role !== "farmer" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only farmers or admins can create products" });
    }

    const {
      name,
      nameHindi,
      description,
      category,
      price,
      unit,
      availableQuantity,
      minOrderQuantity,
      harvestDate,
      images,
      isOrganic,
      isNegotiable,
    } = req.body;

    if (!name || !category || !price || !unit || !availableQuantity) {
      return res.status(400).json({
        message: "Name, category, price, unit and availableQuantity are required",
      });
    }

    const product = new Product({
      name,
      nameHindi,
      description,
      category,
      price,
      unit,
      availableQuantity,
      minOrderQuantity,
      harvestDate,
      images,
      isOrganic,
      isNegotiable,
      farmer: userId,
    });

    await product.save();

    return res.status(201).json({ product: buildProductResponse(product) });
  } catch (err) {
    console.error("Create product error:", err);
    return res.status(500).json({
      message: err.message || "Server error while creating product",
    });
  }
};

// PUT /api/products/:id
// Protected: only owner farmer or admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { role } = req.user || {};

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (role !== "admin" && product.farmer.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this product" });
    }

    const updatableFields = [
      "name",
      "nameHindi",
      "description",
      "category",
      "price",
      "unit",
      "availableQuantity",
      "minOrderQuantity",
      "harvestDate",
      "images",
      "isOrganic",
      "isNegotiable",
      "status",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    return res.json({ product: buildProductResponse(product) });
  } catch (err) {
    console.error("Update product error:", err);
    return res.status(500).json({
      message: err.message || "Server error while updating product",
    });
  }
};

// DELETE /api/products/:id
// Protected: only owner farmer or admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { role } = req.user || {};

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (role !== "admin" && product.farmer.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this product" });
    }

    await product.deleteOne();

    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    return res.status(500).json({
      message: err.message || "Server error while deleting product",
    });
  }
};

