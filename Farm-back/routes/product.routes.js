const express = require("express");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const router = express.Router();

// Public listing & detail (optional auth enables role-based visibility)
router.get("/", optionalAuth, getAllProducts);
router.get("/:id", optionalAuth, getProductById);

// Protected CRUD for farmers/admins
router.post("/", auth, createProduct);
router.put("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;

