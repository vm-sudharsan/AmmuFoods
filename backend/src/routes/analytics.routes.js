const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const { getAnalytics } = require("../controllers/analytics.controller");

const router = express.Router();

router.get("/", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getAnalytics);

module.exports = router;
