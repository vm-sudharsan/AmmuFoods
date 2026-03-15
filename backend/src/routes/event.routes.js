const express = require("express");
const { body, param } = require("express-validator");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createEventRequest,
  getAllEventRequests,
  getEventById,
  updateEventStatus,
  updateEventDetails,
  addEventNote,
  getUserEvents,
} = require("../controllers/event.controller");

const router = express.Router();

// USER + SHOP
router.post("/", auth, allowRoles("USER", "SHOP"), [
  body("eventName").trim().notEmpty().isLength({ min: 2, max: 200 }).withMessage("Event name required (2-200 chars)"),
  body("contactPerson").trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage("Contact person required"),
  body("contactNumber").matches(/^[0-9]{10}$/).withMessage("Contact number must be 10 digits"),
  body("eventLocation").trim().notEmpty().isLength({ max: 500 }).withMessage("Event location required"),
  body("eventDate").notEmpty().isISO8601().withMessage("Valid event date required"),
  body("guestCount").optional().isInt({ min: 1 }).withMessage("Guest count must be positive"),
], validate, createEventRequest);
router.get("/my-events", auth, allowRoles("USER", "SHOP"), getUserEvents);

// ADMIN
router.get(
  "/",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  getAllEventRequests
);
router.get(
  "/:id",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  [param("id").isMongoId().withMessage("Invalid event ID")],
  validate,
  getEventById
);
router.patch(
  "/:id/status",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  [
    param("id").isMongoId().withMessage("Invalid event ID"),
    body("status").isIn(["NEW", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).withMessage("Invalid status"),
  ],
  validate,
  updateEventStatus
);
router.patch(
  "/:id/details",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  [
    param("id").isMongoId().withMessage("Invalid event ID"),
    body("eventName").optional().trim().isLength({ min: 2, max: 200 }),
    body("eventDate").optional().isISO8601(),
  ],
  validate,
  updateEventDetails
);
router.post(
  "/:id/notes",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  [
    param("id").isMongoId().withMessage("Invalid event ID"),
    body("note").trim().notEmpty().isLength({ max: 1000 }).withMessage("Note required (max 1000 chars)"),
  ],
  validate,
  addEventNote
);

module.exports = router;
