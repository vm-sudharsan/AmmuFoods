const express = require("express");
const { body } = require("express-validator");
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { submitShopRequest } = require("../controllers/user.controller");

const router = express.Router();

router.post(
  "/shop-request",
  auth,
  [
    body("shopName").notEmpty(),
    body("location").notEmpty(),
    body("expectedDailyDemand").notEmpty(),
    body("contactNumber").notEmpty(),
  ],
  validate,
  submitShopRequest
);

module.exports = router;
