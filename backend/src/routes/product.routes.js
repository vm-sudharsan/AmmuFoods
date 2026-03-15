const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/product.controller");

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin only routes
router.post("/", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), createProduct);
router.put("/:id", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), updateProduct);
router.delete("/:id", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), deleteProduct);
router.get("/admin/low-stock", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getLowStockProducts);

module.exports = router;
