const express = require("express");
const { body, param } = require("express-validator");
const auth = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  getShopRequests,
  approveShopRequest,
  rejectShopRequest,
  updateShopPartnership,
  cancelShopPartnership,
  approveCancellationRequest,
  getShopDetails,
  getAdminDashboard,
  getComprehensiveDashboard,
  getManufacturingDashboard,
  getSystemHealth,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/admin.controller");
const {
  getAllOrders,
  updateOrderStatus,
  getManufacturingPlan,
  getPackingList,
  getOrder,
  getManufacturingStats,
  getPackingListOrders,
  markOrderPrinted,
  searchOrders,
} = require("../controllers/order.controller");

const router = express.Router();

// Shop request management
router.get("/shop-requests", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getShopRequests);
router.get("/shop-requests/:id", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid shop request ID"),
], validate, getShopDetails);
router.post("/shop-requests/:id/approve", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid shop request ID"),
  body("adminNotes").optional().trim().isLength({ max: 500 }),
], validate, approveShopRequest);
router.post("/shop-requests/:id/reject", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid shop request ID"),
  body("adminNotes").optional().trim().isLength({ max: 500 }),
], validate, rejectShopRequest);
router.post("/shop-requests/:id/approve-cancellation", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid shop request ID"),
], validate, approveCancellationRequest);
router.put("/shop-requests/:id", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid shop request ID"),
  body("shopName").optional().trim().isLength({ min: 2, max: 100 }),
  body("shopOwnerName").optional().trim().isLength({ min: 2, max: 100 }),
  body("contactNumber").optional().matches(/^[0-9]{10}$/),
  body("shopAddress").optional().trim().isLength({ max: 500 }),
], validate, updateShopPartnership);
router.post("/shop-requests/:id/cancel", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid shop request ID"),
  body("reason").optional().trim().isLength({ max: 500 }),
], validate, cancelShopPartnership);

// Dashboard
router.get("/dashboard", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getAdminDashboard);
router.get("/dashboard/comprehensive", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getComprehensiveDashboard);
router.get("/dashboard/manufacturing", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getManufacturingDashboard);

// Notifications
router.get("/notifications", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getNotifications);
router.get("/notifications/unread-count", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getUnreadNotificationCount);
router.patch("/notifications/:id/read", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid notification ID"),
], validate, markNotificationAsRead);
router.patch("/notifications/mark-all-read", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), markAllNotificationsAsRead);

// Order management
router.get("/orders", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getAllOrders);
router.get("/orders/search", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), searchOrders);
router.get("/orders/:id", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid order ID"),
], validate, getOrder);
router.patch("/orders/:id/status", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("status")
    .isIn(["PLACED", "APPROVED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"])
    .withMessage("Invalid status"),
], validate, updateOrderStatus);
router.post("/orders/:id/print", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), [
  param("id").isMongoId().withMessage("Invalid order ID"),
], validate, markOrderPrinted);

// Manufacturing and packing
router.get("/manufacturing/stats", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getManufacturingStats);
router.get("/manufacturing-plan/:date", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getManufacturingPlan);
router.get("/packing/list", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getPackingListOrders);
router.get("/packing-list/:date", auth, allowRoles("ADMIN", "DEVELOPER_ADMIN"), getPackingList);

// System health
router.get("/system/health", auth, allowRoles("DEVELOPER_ADMIN"), getSystemHealth);

module.exports = router;
