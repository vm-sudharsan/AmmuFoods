const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const {
  createEventRequest,
  getAllEventRequests,
  updateEventStatus,
} = require("../controllers/event.controller");

const router = express.Router();

// USER + SHOP
router.post("/", auth, allowRoles("USER", "SHOP"), createEventRequest);

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
