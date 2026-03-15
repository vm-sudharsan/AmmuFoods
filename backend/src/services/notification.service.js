const Notification = require("../models/Notification.model");
const { User } = require("../models/User.model");

/**
 * Create notification for user
 * @param {ObjectId} userId - User ID
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {string} priority - Priority level (HIGH, MEDIUM, LOW)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Notification>}
 */
const createNotification = async (userId, type, message, priority = "MEDIUM", metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      priority,
      metadata,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw - notification failure shouldn't break the flow
    return null;
  }
};

/**
 * Create notification for all admins
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {string} priority - Priority level
 * @param {Object} metadata - Additional metadata
 */
const notifyAdmins = async (type, message, priority = "MEDIUM", metadata = {}) => {
  try {
    const admins = await User.find({ role: "ADMIN", isActive: true });
    
    const notifications = admins.map((admin) =>
      createNotification(admin._id, type, message, priority, metadata)
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
};

/**
 * Get user notifications (for regular users and shop users)
 * @param {ObjectId} userId - User ID
 * @param {boolean} unreadOnly - Filter unread only
 * @returns {Promise<Array>}
 */
const getUserNotifications = async (userId, unreadOnly = false) => {
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  return Notification.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(50);
};

/**
 * Get unread count for user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>}
 */
const getUserUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, isRead: false });
};

/**
 * Mark notification as read
 * @param {ObjectId} notificationId - Notification ID
 * @returns {Promise<Notification>}
 */
const markAsRead = async (notificationId) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};

/**
 * Mark all user notifications as read
 * @param {ObjectId} userId - User ID
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

/**
 * Get unread count for user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, isRead: false });
};

/**
 * Get admin notifications (all notifications for admin users)
 * @param {boolean} unreadOnly - Filter unread only
 * @returns {Promise<Array>}
 */
const getAdminNotifications = async (unreadOnly = false) => {
  try {
    // Get all admin users
    const admins = await User.find({ 
      role: { $in: ["ADMIN", "DEVELOPER_ADMIN"] }, 
      isActive: true 
    });
    
    const adminIds = admins.map(admin => admin._id);
    
    const query = { userId: { $in: adminIds } };
    if (unreadOnly) {
      query.isRead = false;
    }

    return Notification.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(100);
  } catch (error) {
    console.error("Failed to get admin notifications:", error);
    return [];
  }
};

module.exports = {
  createNotification,
  notifyAdmins,
  getUserNotifications,
  getAdminNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserUnreadCount,
};
