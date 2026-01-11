const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const router = express.Router();

// Public
router.get("/", getProducts);

// Admin only
router.post("/", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), createProduct);
router.put("/:id", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), updateProduct);
router.delete(
  "/:id",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  deleteProduct
);

module.exports = router;
