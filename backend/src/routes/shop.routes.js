const express = require("express");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const { placeOrder, getMyOrders } = require("../controllers/order.controller");

const router = express.Router();

router.post("/orders", auth, allowRoles("SHOP"), placeOrder);

router.get("/orders", auth, allowRoles("SHOP"), getMyOrders);

module.exports = router;
