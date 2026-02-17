const express = require("express");
const auth = require("../middleware/auth");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const router = express.Router();

// Public listing & detail
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected CRUD for farmers/admins
router.post("/", auth, createProduct);
router.put("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;

