const Product = require("../models/Product");

// Helper to build a consistent product payload
const buildProductResponse = (product) => {
  if (!product) return null;
  const plain = product.toObject ? product.toObject() : product;
  return plain;
};

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter)
      .populate("farmer", "name location kycStatus")
      .sort({ createdAt: -1 });

    return res.json({
      products: products.map(buildProductResponse),
    });
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
      "name location kycStatus"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increment views (fire-and-forget)
    Product.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(() => {});

    return res.json({ product: buildProductResponse(product) });
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

