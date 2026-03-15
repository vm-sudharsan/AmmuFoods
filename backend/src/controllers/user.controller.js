const ShopRequest = require("../models/ShopRequest.model");
const { User } = require("../models/User.model");
const { createNotification } = require("../services/notification.service");
const { sendMail } = require("../services/mail.service");
const { uploadImage, deleteImage } = require("../services/cloudinary.service");

const submitShopRequest = async (req, res) => {
  try {
    const {
      ownerName,
      shopName,
      fullAddress,
      area,
      contactNumber,
      alternateNumber,
      expectedDailyDemand,
      preferredDeliveryTime,
      notes,
    } = req.body;

    // Check if user already has a pending or approved request
    const existingRequest = await ShopRequest.findOne({
      userId: req.user._id,
      status: { $in: ["PENDING", "APPROVED"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          existingRequest.status === "APPROVED"
            ? "You already have an approved shop partnership"
            : "You already have a pending shop request",
        request: existingRequest,
      });
    }

    const request = await ShopRequest.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      shopOwnerName: ownerName,
      shopName,
      shopAddress: fullAddress,
      area,
      contactNumber,
      alternateContact: alternateNumber,
      dailyStockNeeded: expectedDailyDemand,
      preferredDeliveryTime,
      additionalNotes: notes,
    });

    // Notify Admin (in-app) - wrapped in try-catch to not break flow
    try {
      const admins = await User.find({ role: "ADMIN", isActive: true });
      
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "SHOP_REQUEST",
          `New shop request from ${shopName} (${req.user.email})`,
          "MEDIUM",
          {
            shopName,
            ownerName,
            requestId: request._id
          }
        );
      }
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Notify Admin (email) - wrapped in try-catch to not break flow
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL,
        subject: "New Shop Partnership Request - Ammu Foods",
        html: `
          <h2>New Shop Partnership Request</h2>
          <p><strong>Shop Name:</strong> ${shopName}</p>
          <p><strong>Owner:</strong> ${ownerName}</p>
          <p><strong>Email:</strong> ${req.user.email}</p>
          <p><strong>Contact:</strong> ${contactNumber}</p>
          <p><strong>Location:</strong> ${area}, ${fullAddress}</p>
          <p><strong>Expected Daily Demand:</strong> ${expectedDailyDemand}</p>
          <p><strong>Preferred Delivery Time:</strong> ${preferredDeliveryTime || "Not specified"}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
          <p>Please review and approve/reject this request in the admin dashboard.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Continue - email failure should not break the request submission
    }

    // Notify User (email confirmation) - wrapped in try-catch to not break flow
    try {
      await sendMail({
        to: req.user.email,
        subject: "Shop Partnership Request Received - Ammu Foods",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Shop Partnership Request Received</h2>
            <p>Dear ${ownerName},</p>
            <p>Thank you for your interest in partnering with <strong>Ammu Foods</strong>!</p>
            <p>We have received your shop partnership request with the following details:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Shop Name:</strong> ${shopName}</p>
              <p><strong>Location:</strong> ${area}, ${fullAddress}</p>
              <p><strong>Contact Number:</strong> ${contactNumber}</p>
              <p><strong>Expected Daily Demand:</strong> ${expectedDailyDemand}</p>
            </div>
            <p>Our team will review your request and get back to you within 2-3 business days.</p>
            <p>You will receive an email notification once your request has been reviewed.</p>
            <p>If you have any questions, please feel free to contact us.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>Ammu Foods Team</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send user confirmation email:", emailError);
    }

    res.status(201).json({
      message: "Shop partnership request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Error submitting shop request:", error);
    res.status(500).json({
      message: "Failed to submit shop request",
      error: error.message,
    });
  }
};

const getShopRequestStatus = async (req, res) => {
  try {
    // Get the most recent request
    const request = await ShopRequest.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ request });
  } catch (error) {
    console.error("Error fetching shop request:", error);
    res.status(500).json({
      message: "Failed to fetch shop request status",
    });
  }
};

module.exports = { submitShopRequest, getShopRequestStatus };


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user._id;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if exists
    if (user.profilePicturePublicId) {
      await deleteImage(user.profilePicturePublicId);
    }

    // Upload new image
    const { url, publicId } = await uploadImage(image, "ammufoods/profiles");

    user.profilePicture = url;
    user.profilePicturePublicId = publicId;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "Profile picture updated successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({
      message: "Failed to update profile picture",
      error: error.message
    });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from cloudinary
    if (user.profilePicturePublicId) {
      await deleteImage(user.profilePicturePublicId);
    }

    user.profilePicture = undefined;
    user.profilePicturePublicId = undefined;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "Profile picture deleted successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({
      message: "Failed to delete profile picture",
      error: error.message
    });
  }
};

module.exports = { 
  submitShopRequest, 
  getShopRequestStatus,
  getProfile,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture
};


const requestPartnershipCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;

    // Find active partnership
    const request = await ShopRequest.findOne({
      userId,
      status: "APPROVED",
      partnershipStatus: "ACTIVE"
    });

    if (!request) {
      return res.status(404).json({ 
        message: "No active partnership found" 
      });
    }

    // Check if cancellation already requested
    if (request.partnershipStatus === "CANCELLATION_PENDING") {
      return res.status(400).json({ 
        message: "Cancellation request already submitted" 
      });
    }

    // Update status to cancellation requested
    request.status = "CANCELLATION_REQUESTED";
    request.partnershipStatus = "CANCELLATION_PENDING";
    request.cancellationReason = reason || "Requested by shop owner";
    request.cancellationRequestedBy = "SHOP";
    request.cancellationRequestedAt = new Date();
    await request.save();

    // Notify admin
    try {
      const admins = await User.find({ role: "ADMIN", isActive: true });
      
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "SHOP_REQUEST",
          `Partnership cancellation requested by ${request.shopName}`,
          "MEDIUM",
          {
            shopName: request.shopName,
            requestId: request._id,
            reason: reason || "No reason provided"
          }
        );
      }
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Send email to admin
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL,
        subject: "Partnership Cancellation Request - Ammu Foods",
        html: `
          <h2>Partnership Cancellation Request</h2>
          <p><strong>Shop Name:</strong> ${request.shopName}</p>
          <p><strong>Owner:</strong> ${request.shopOwnerName}</p>
          <p><strong>Email:</strong> ${req.user.email}</p>
          <p><strong>Contact:</strong> ${request.contactNumber}</p>
          <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
          <p>Please review and approve/reject this cancellation request in the admin dashboard.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
    }

    res.json({
      message: "Cancellation request submitted successfully. Admin will review your request.",
      request
    });
  } catch (error) {
    console.error("Error requesting cancellation:", error);
    res.status(500).json({
      message: "Failed to submit cancellation request",
      error: error.message
    });
  }
};

// User Notifications
const getUserNotifications = async (req, res) => {
  try {
    const { getUserNotifications } = require("../services/notification.service");
    const { unreadOnly } = req.query;
    
    const notifications = await getUserNotifications(req.user._id, unreadOnly === 'true');
    
    res.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

const getUserUnreadCount = async (req, res) => {
  try {
    const { getUserUnreadCount } = require("../services/notification.service");
    
    const count = await getUserUnreadCount(req.user._id);
    
    res.json({
      count,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

const markUserNotificationAsRead = async (req, res) => {
  try {
    const { markAsRead } = require("../services/notification.service");
    const { id } = req.params;
    
    const notification = await markAsRead(id);
    
    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }
    
    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

const markAllUserNotificationsAsRead = async (req, res) => {
  try {
    const { markAllAsRead } = require("../services/notification.service");
    
    await markAllAsRead(req.user._id);
    
    res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

module.exports = { 
  submitShopRequest, 
  getShopRequestStatus,
  requestPartnershipCancellation,
  getProfile,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
  getUserNotifications,
  getUserUnreadCount,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
};
