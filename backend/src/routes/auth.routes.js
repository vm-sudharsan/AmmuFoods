const express = require("express");
const { body } = require("express-validator");
const { googleLogin, me, logout, signup, login } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

// Signup with email/password - with validation
router.post(
  "/signup",
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  ],
  validate,
  signup
);

// Login with email/password - with validation
router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  validate,
  login
);

// Google OAuth login - with validation
router.post(
  "/google-login",
  [
    body("token")
      .notEmpty()
      .withMessage("Google token is required"),
  ],
  validate,
  googleLogin
);

router.get("/me", authMiddleware, me);
router.post("/logout", authMiddleware, logout);

module.exports = router;
