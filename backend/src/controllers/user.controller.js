const ShopRequest = require("../models/ShopRequest.model");
const { createNotification } = require("../services/notification.service");
const { sendMail } = require("../services/mail.service");

const submitShopRequest = async (req, res) => {
  const { shopName, location, expectedDailyDemand, contactNumber } = req.body;

  const request = await ShopRequest.create({
    userId: req.user._id,
    shopName,
    location,
    expectedDailyDemand,
    contactNumber,
  });

  // Notify Admin (in-app)
  await createNotification({
    targetRole: "ADMIN",
    message: `New shop request from ${req.user.email}`,
    priority: "MEDIUM",
  });

  // Notify Admin (email)
  await sendMail({
    to: process.env.SMTP_EMAIL,
    subject: "New Shop Partnership Request",
    html: `<p>New shop request from <b>${req.user.email}</b></p>`,
  });

  res.status(201).json({
    message: "Shop partnership request submitted",
    request,
  });
};

module.exports = { submitShopRequest };
