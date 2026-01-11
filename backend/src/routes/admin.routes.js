const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const { getShopRequests } = require("../controllers/admin.controller");

const router = express.Router();

router.get(
  "/shop-requests",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  getShopRequests
);

module.exports = router;
const {
  approveShopRequest,
  rejectShopRequest,
} = require("../controllers/admin.controller");

router.post(
  "/shop-requests/:id/approve",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  approveShopRequest
);

router.post(
  "/shop-requests/:id/reject",
  auth,
  allowRoles("ADMIN", "DEVELOPER_ADMIN"),
  rejectShopRequest
);
