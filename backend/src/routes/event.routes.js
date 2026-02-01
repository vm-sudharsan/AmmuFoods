const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const {
  createEventRequest,
  getAllEventRequests,
  updateEventStatus,
  getUserEvents,
} = require("../controllers/event.controller");

const router = express.Router();

// USER + SHOP
router.post("/", auth, allowRoles("USER", "SHOP"), createEventRequest);
router.get("/my-events", auth, allowRoles("USER", "SHOP"), getUserEvents);

// ADMIN
router.get(
  "/",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  getAllEventRequests
);
router.patch(
  "/:id/status",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  updateEventStatus
);

module.exports = router;
