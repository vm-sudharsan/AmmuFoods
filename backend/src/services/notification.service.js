const Notification = require("../models/Notification.model");

const createNotification = async ({
  targetUserId,
  targetRole,
  message,
  priority = "LOW",
}) => {
  return Notification.create({
    targetUserId,
    targetRole,
    message,
    priority,
  });
};

module.exports = { createNotification };
