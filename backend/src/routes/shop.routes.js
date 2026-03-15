const express = require("express");
const { body } = require("express-validator");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { 
  placeOrder, 
  getMyOrders,
  getOrder,
} = require("../controllers/order.controller");

const router = express.Router();

// Shop order routes
router.post(
  "/orders",
  auth,
  allowRoles("SHOP"),
  [
    body("products")
      .isArray({ min: 1 })
      .withMessage("Products must be a non-empty array"),
    body("products.*.productId")
      .isMongoId()
      .withMessage("Invalid product ID"),
    body("products.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("deliveryDate")
      .notEmpty()
      .withMessage("Delivery date is required")
      .isISO8601()
      .withMessage("Invalid date format"),
    body("deliveryAddress")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Address too long"),
    body("contactNumber")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Contact number must be 10 digits"),
  ],
  validate,
  placeOrder
);

router.get("/orders", auth, allowRoles("SHOP"), getMyOrders);
router.get("/orders/:id", auth, allowRoles("SHOP"), getOrder);

module.exports = router;
