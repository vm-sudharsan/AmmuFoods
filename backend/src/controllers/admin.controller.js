const ShopRequest = require("../models/ShopRequest.model");

const getShopRequests = async (req, res) => {
  const requests = await ShopRequest.find()
    .populate("userId", "email name role")
    .sort({ createdAt: -1 });

  res.json({ requests });
};

module.exports = { getShopRequests };
const { User, USER_ROLES } = require("../models/User.model");
const { createNotification } = require("../services/notification.service");
const { sendMail } = require("../services/mail.service");

const approveShopRequest = async (req, res) => {
  const request = await ShopRequest.findById(req.params.id).populate("userId");

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "APPROVED";
  await request.save();

  // Upgrade user role
  const user = await User.findById(request.userId._id);
  user.role = USER_ROLES.SHOP;
  await user.save();

  // Notify user
  await createNotification({
    targetUserId: user._id,
    message: "Your shop partnership request has been approved",
    priority: "HIGH",
  });

  await sendMail({
    to: user.email,
    subject: "Shop Partnership Approved",
    html: `<p>Your shop request has been approved. You can now place daily orders.</p>`,
  });

  res.json({ message: "Shop request approved" });
};

const rejectShopRequest = async (req, res) => {
  const request = await ShopRequest.findById(req.params.id).populate("userId");

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "REJECTED";
  await request.save();

  await createNotification({
    targetUserId: request.userId._id,
    message: "Your shop partnership request has been rejected",
    priority: "MEDIUM",
  });

  res.json({ message: "Shop request rejected" });
};

module.exports = {
  getShopRequests,
  approveShopRequest,
  rejectShopRequest,
};
const { getTomorrowManufacturingData } = require("../services/report.service");
const Notification = require("../models/Notification.model");

const getAdminDashboard = async (req, res) => {
  const manufacturingData = await getTomorrowManufacturingData();

  const notifications = await Notification.find({
    targetRole: "ADMIN",
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(10);

  res.json({
    manufacturing: manufacturingData,
    notifications,
  });
};

module.exports.getAdminDashboard = getAdminDashboard;
