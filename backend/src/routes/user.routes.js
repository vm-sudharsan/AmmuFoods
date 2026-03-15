const express = require("express");
const { body } = require("express-validator");
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  submitShopRequest,
  getShopRequestStatus,
  requestPartnershipCancellation,
  getProfile,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
  getUserNotifications,
  getUserUnreadCount,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
} = require("../controllers/user.controller");

const router = express.Router();

// Shop Partnership Request
router.post(
  "/shop-request",
  auth,
  [
    body("ownerName")
      .notEmpty()
      .withMessage("Owner name is required")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Owner name must be between 2 and 100 characters"),
    body("shopName")
      .notEmpty()
      .withMessage("Shop name is required")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Shop name must be between 2 and 100 characters"),
    body("fullAddress")
      .notEmpty()
      .withMessage("Full address is required")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Address must be between 10 and 500 characters"),
    body("area")
      .notEmpty()
      .withMessage("Area/Locality is required")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Area must be between 2 and 100 characters"),
    body("contactNumber")
      .notEmpty()
      .withMessage("Contact number is required")
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage("Contact number must be 10 digits"),
    body("alternateNumber")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage("Alternate number must be 10 digits"),
    body("expectedDailyDemand")
      .notEmpty()
      .withMessage("Expected daily demand is required")
      .trim(),
    body("preferredDeliveryTime").optional().trim(),
    body("notes").optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  submitShopRequest
);

router.get("/shop-request", auth, getShopRequestStatus);

router.post("/shop-request/cancel", auth, requestPartnershipCancellation);

// Profile Management
router.get("/profile", auth, getProfile);

router.put(
  "/profile",
  auth,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("phone")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone number must be 10 digits"),
  ],
  validate,
  updateProfile
);

router.put("/profile/picture", auth, updateProfilePicture);

router.delete("/profile/picture", auth, deleteProfilePicture);

// Notifications
router.get("/notifications", auth, getUserNotifications);
router.get("/notifications/unread-count", auth, getUserUnreadCount);
router.patch("/notifications/:id/read", auth, markUserNotificationAsRead);
router.patch("/notifications/mark-all-read", auth, markAllUserNotificationsAsRead);

module.exports = router;
