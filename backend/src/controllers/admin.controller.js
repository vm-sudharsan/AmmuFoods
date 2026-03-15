const ShopRequest = require("../models/ShopRequest.model");
const { User, USER_ROLES } = require("../models/User.model");
const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const EventRequest = require("../models/EventRequest.model");
const { createNotification } = require("../services/notification.service");
const { sendMail } = require("../services/mail.service");
const { getTomorrowManufacturingData } = require("../services/report.service");
const { createAuditLog } = require("../services/audit.service");
const Notification = require("../models/Notification.model");

const getShopRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const requests = await ShopRequest.find(query)
      .populate("userId", "email name role")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error("Error fetching shop requests:", error);
    res.status(500).json({ message: "Failed to fetch shop requests" });
  }
};

const approveShopRequest = async (req, res) => {
  try {
    const request = await ShopRequest.findById(req.params.id).populate(
      "userId"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "APPROVED") {
      return res.status(400).json({ message: "Request already approved" });
    }

    // Update request status
    request.status = "APPROVED";
    request.partnershipStatus = "ACTIVE";
    request.partnershipStartDate = new Date();
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (req.body && req.body.adminNotes) {
      request.adminNotes = req.body.adminNotes;
    }
    await request.save();

    // Upgrade user role
    const user = await User.findById(request.userId._id);
    const oldRole = user.role;
    user.role = USER_ROLES.SHOP;
    await user.save();

    // Create audit log for shop approval
    await createAuditLog({
      userId: req.user._id,
      action: "SHOP_REQUEST_APPROVED",
      entityType: "ShopRequest",
      entityId: request._id,
      changes: {
        before: { status: "PENDING" },
        after: { status: "APPROVED", reviewedBy: req.user._id },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: `Shop request approved for ${request.shopName}`,
      },
    });

    // Create audit log for role change
    await createAuditLog({
      userId: req.user._id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: user._id,
      changes: {
        before: { role: oldRole },
        after: { role: USER_ROLES.SHOP },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: `Role upgraded due to shop request approval`,
      },
    });

    // Notify user (in-app)
    try {
      await createNotification(
        user._id,
        "SHOP_REQUEST",
        `Your shop partnership request for "${request.shopName}" has been approved! You can now place daily orders.`,
        "HIGH",
        {
          shopName: request.shopName,
          requestId: request._id
        }
      );
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Notify user (email)
    try {
      await sendMail({
        to: user.email,
        subject: "Shop Partnership Approved - Ammu Foods",
        html: `
          <h2>Congratulations! Your Shop Partnership is Approved</h2>
          <p>Dear ${request.shopOwnerName},</p>
          <p>We are pleased to inform you that your shop partnership request for <strong>${request.shopName}</strong> has been approved.</p>
          <p>You can now:</p>
          <ul>
            <li>Place daily orders for next-day delivery</li>
            <li>View your order history</li>
            <li>Track order status</li>
          </ul>
          <p>Please log in to your account to start placing orders.</p>
          <p>Thank you for partnering with Ammu Foods!</p>
          <p>Best regards,<br>Ammu Foods Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    res.json({
      message: "Shop request approved successfully",
      request,
    });
  } catch (error) {
    console.error("Error approving shop request:", error);
    res.status(500).json({
      message: "Failed to approve shop request",
      error: error.message,
    });
  }
};

const rejectShopRequest = async (req, res) => {
  try {
    const request = await ShopRequest.findById(req.params.id).populate(
      "userId"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "REJECTED") {
      return res.status(400).json({ message: "Request already rejected" });
    }

    // Update request status
    request.status = "REJECTED";
    if (req.body && req.body.adminNotes) {
      request.adminNotes = req.body.adminNotes;
    }
    await request.save();

    // Create audit log
    await createAuditLog({
      userId: req.user._id,
      action: "SHOP_REQUEST_REJECTED",
      entityType: "ShopRequest",
      entityId: request._id,
      changes: {
        before: { status: request.status },
        after: { status: "REJECTED" },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: req.body.adminNotes || "No reason provided",
      },
    });

    // Notify user (in-app)
    try {
      await createNotification(
        request.userId._id,
        "SHOP_REQUEST",
        `Your shop partnership request for "${request.shopName}" has been rejected.`,
        "MEDIUM",
        {
          shopName: request.shopName,
          requestId: request._id,
          reason: req.body.adminNotes || "No reason provided"
        }
      );
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Notify user (email) - optional, might not want to send rejection emails
    try {
      if (req.body.sendEmail !== false) {
        await sendMail({
          to: request.userId.email,
          subject: "Shop Partnership Request Update - Ammu Foods",
          html: `
            <h2>Shop Partnership Request Update</h2>
            <p>Dear ${request.shopOwnerName},</p>
            <p>Thank you for your interest in partnering with Ammu Foods.</p>
            <p>After careful review, we are unable to approve your shop partnership request for <strong>${request.shopName}</strong> at this time.</p>
            ${req.body.adminNotes ? `<p><strong>Reason:</strong> ${req.body.adminNotes}</p>` : ""}
            <p>You may submit a new request in the future if circumstances change.</p>
            <p>Thank you for your understanding.</p>
            <p>Best regards,<br>Ammu Foods Team</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    res.json({
      message: "Shop request rejected",
      request,
    });
  } catch (error) {
    console.error("Error rejecting shop request:", error);
    res.status(500).json({
      message: "Failed to reject shop request",
      error: error.message,
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const Order = require("../models/Order.model");
    const Product = require("../models/Product.model");
    const { getAdminNotifications } = require("../services/notification.service");
    
    // Get pending shop requests count
    const pendingShopRequests = await ShopRequest.countDocuments({
      status: "PENDING",
    });

    // Get pending orders count (not delivered or cancelled)
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["PLACED", "APPROVED", "MANUFACTURING", "PACKING"] }
    });

    // Get low stock items count (items with stock below 10)
    const lowStockItems = await Product.countDocuments({
      currentStock: { $lt: 10 },
      isAvailable: true
    });

    // Get today's revenue (delivered orders today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysOrders = await Order.find({
      status: "DELIVERED",
      updatedAt: { $gte: today, $lt: tomorrow }
    });

    const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Get recent notifications for all admins
    const notifications = await getAdminNotifications(false);

    res.json({
      stats: {
        pendingShopRequests,
        pendingOrders,
        lowStockItems,
        todaysRevenue,
      },
      notifications: notifications.slice(0, 5), // Only send 5 for dashboard
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const mongoose = require("mongoose");

    res.json({
      status: "OK",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
      database: {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        name: mongoose.connection.name,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

module.exports = {
  getShopRequests,
  approveShopRequest,
  rejectShopRequest,
  getAdminDashboard,
  getSystemHealth,
};


const updateShopPartnership = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopName, shopOwnerName, contactNumber, alternateContact, dailyStockNeeded, preferredDeliveryTime, shopAddress, area, adminNotes } = req.body;

    const request = await ShopRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Track changes for audit
    const changes = { before: {}, after: {} };

    if (shopName && shopName !== request.shopName) {
      changes.before.shopName = request.shopName;
      changes.after.shopName = shopName;
      request.shopName = shopName;
    }

    if (shopOwnerName && shopOwnerName !== request.shopOwnerName) {
      changes.before.shopOwnerName = request.shopOwnerName;
      changes.after.shopOwnerName = shopOwnerName;
      request.shopOwnerName = shopOwnerName;
    }

    if (contactNumber && contactNumber !== request.contactNumber) {
      changes.before.contactNumber = request.contactNumber;
      changes.after.contactNumber = contactNumber;
      request.contactNumber = contactNumber;
    }

    if (alternateContact !== undefined && alternateContact !== request.alternateContact) {
      changes.before.alternateContact = request.alternateContact;
      changes.after.alternateContact = alternateContact;
      request.alternateContact = alternateContact;
    }

    if (dailyStockNeeded && dailyStockNeeded !== request.dailyStockNeeded) {
      changes.before.dailyStockNeeded = request.dailyStockNeeded;
      changes.after.dailyStockNeeded = dailyStockNeeded;
      request.dailyStockNeeded = dailyStockNeeded;
    }

    if (preferredDeliveryTime !== undefined && preferredDeliveryTime !== request.preferredDeliveryTime) {
      changes.before.preferredDeliveryTime = request.preferredDeliveryTime;
      changes.after.preferredDeliveryTime = preferredDeliveryTime;
      request.preferredDeliveryTime = preferredDeliveryTime;
    }

    if (shopAddress && shopAddress !== request.shopAddress) {
      changes.before.shopAddress = request.shopAddress;
      changes.after.shopAddress = shopAddress;
      request.shopAddress = shopAddress;
    }

    if (area && area !== request.area) {
      changes.before.area = request.area;
      changes.after.area = area;
      request.area = area;
    }

    if (adminNotes !== undefined) {
      request.adminNotes = adminNotes;
    }

    await request.save();

    // Create audit log
    if (Object.keys(changes.after).length > 0) {
      await createAuditLog({
        userId: req.user._id,
        action: "SHOP_PARTNERSHIP_UPDATED",
        entityType: "ShopRequest",
        entityId: request._id,
        changes,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          notes: `Shop partnership details updated for ${request.shopName}`,
        },
      });
    }

    res.json({
      message: "Shop partnership updated successfully",
      request,
    });
  } catch (error) {
    console.error("Error updating shop partnership:", error);
    res.status(500).json({
      message: "Failed to update shop partnership",
      error: error.message,
    });
  }
};

const cancelShopPartnership = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await ShopRequest.findById(id).populate("userId");

    if (!request) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (request.status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved partnerships can be cancelled" });
    }

    // Update partnership status
    request.status = "CANCELLED";
    request.partnershipStatus = "CANCELLED";
    request.partnershipEndDate = new Date();
    request.cancellationReason = reason || "Cancelled by admin";
    request.cancellationRequestedBy = "ADMIN";
    request.cancellationRequestedAt = new Date();
    await request.save();

    // Downgrade user role back to USER
    const user = await User.findById(request.userId._id);
    const oldRole = user.role;
    user.role = USER_ROLES.USER;
    await user.save();

    // Create audit log for cancellation
    await createAuditLog({
      userId: req.user._id,
      action: "SHOP_PARTNERSHIP_CANCELLED",
      entityType: "ShopRequest",
      entityId: request._id,
      changes: {
        before: { status: "APPROVED", partnershipStatus: "ACTIVE" },
        after: { status: "CANCELLED", partnershipStatus: "CANCELLED" },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: reason || "No reason provided",
      },
    });

    // Create audit log for role change
    await createAuditLog({
      userId: req.user._id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: user._id,
      changes: {
        before: { role: oldRole },
        after: { role: USER_ROLES.USER },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: `Role downgraded due to partnership cancellation`,
      },
    });

    // Notify user
    try {
      await createNotification(
        user._id,
        "SHOP_REQUEST",
        `Your shop partnership for "${request.shopName}" has been cancelled.`,
        "HIGH",
        {
          shopName: request.shopName,
          requestId: request._id,
          reason: reason || "No reason provided"
        }
      );
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Send email
    try {
      await sendMail({
        to: user.email,
        subject: "Shop Partnership Cancelled - Ammu Foods",
        html: `
          <h2>Shop Partnership Cancellation Notice</h2>
          <p>Dear ${request.shopOwnerName},</p>
          <p>We regret to inform you that your shop partnership for <strong>${request.shopName}</strong> has been cancelled.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>If you have any questions or would like to discuss this decision, please contact us.</p>
          <p>Thank you for your partnership.</p>
          <p>Best regards,<br>Ammu Foods Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    res.json({
      message: "Shop partnership cancelled successfully",
      request,
    });
  } catch (error) {
    console.error("Error cancelling shop partnership:", error);
    res.status(500).json({
      message: "Failed to cancel shop partnership",
      error: error.message,
    });
  }
};

const getShopDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await ShopRequest.findById(id)
      .populate("userId", "name email phone profilePicture")
      .populate("reviewedBy", "name email")
      .lean();

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Get shop orders
    const Order = require("../models/Order.model");
    const orders = await Order.find({ userId: shop.userId._id })
      .populate("items.productId", "name unit")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === "DELIVERED").length,
      pendingOrders: orders.filter(o => o.status === "PENDING").length,
      totalRevenue: orders
        .filter(o => o.status === "DELIVERED")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    res.json({
      shop,
      orders,
      stats,
    });
  } catch (error) {
    console.error("Error fetching shop details:", error);
    res.status(500).json({
      message: "Failed to fetch shop details",
      error: error.message,
    });
  }
};

const approveCancellationRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ShopRequest.findById(id).populate("userId");

    if (!request) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (request.status !== "CANCELLATION_REQUESTED") {
      return res.status(400).json({ message: "No cancellation request found" });
    }

    // Update partnership status
    request.status = "CANCELLED";
    request.partnershipStatus = "CANCELLED";
    request.partnershipEndDate = new Date();
    await request.save();

    // Downgrade user role back to USER
    const user = await User.findById(request.userId._id);
    const oldRole = user.role;
    user.role = USER_ROLES.USER;
    await user.save();

    // Create audit log for cancellation approval
    await createAuditLog({
      userId: req.user._id,
      action: "SHOP_CANCELLATION_APPROVED",
      entityType: "ShopRequest",
      entityId: request._id,
      changes: {
        before: { status: "CANCELLATION_REQUESTED", partnershipStatus: "CANCELLATION_PENDING" },
        after: { status: "CANCELLED", partnershipStatus: "CANCELLED" },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: request.cancellationReason || "No reason provided",
      },
    });

    // Create audit log for role change
    await createAuditLog({
      userId: req.user._id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: user._id,
      changes: {
        before: { role: oldRole },
        after: { role: USER_ROLES.USER },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: `Role downgraded due to partnership cancellation approval`,
      },
    });

    // Notify user
    try {
      await createNotification(
        user._id,
        "SHOP_REQUEST",
        `Your partnership cancellation request for "${request.shopName}" has been approved.`,
        "HIGH",
        {
          shopName: request.shopName,
          requestId: request._id
        }
      );
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Send email
    try {
      await sendMail({
        to: user.email,
        subject: "Partnership Cancellation Approved - Ammu Foods",
        html: `
          <h2>Partnership Cancellation Approved</h2>
          <p>Dear ${request.shopOwnerName},</p>
          <p>Your partnership cancellation request for <strong>${request.shopName}</strong> has been approved.</p>
          <p>Your partnership has been terminated as of ${new Date().toLocaleDateString()}.</p>
          <p>Thank you for your partnership with Ammu Foods.</p>
          <p>Best regards,<br>Ammu Foods Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation approval email:", emailError);
    }

    res.json({
      message: "Cancellation request approved successfully",
      request,
    });
  } catch (error) {
    console.error("Error approving cancellation request:", error);
    res.status(500).json({
      message: "Failed to approve cancellation request",
      error: error.message,
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { getAdminNotifications } = require("../services/notification.service");
    const { unreadOnly } = req.query;
    
    const notifications = await getAdminNotifications(unreadOnly === 'true');
    
    res.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const { getUnreadCount } = require("../services/notification.service");
    
    const count = await getUnreadCount(req.user._id);
    
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

const markNotificationAsRead = async (req, res) => {
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

const getComprehensiveDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel data fetching for better performance
    const [
      totalRevenue,
      lastMonthRevenue,
      activeOrders,
      urgentOrders,
      activeShops,
      pendingShopRequests,
      lowStockProducts,
      criticalStockProducts,
      itemsToPack,
      readyForDelivery,
      completedToday,
      recentActivity,
      urgentOrdersList,
      pendingRequestsList,
      revenueChart,
      orderStatusChart
    ] = await Promise.all([
      // Total Revenue (all time)
      Order.aggregate([
        { $match: { status: 'DELIVERED' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Last Month Revenue
      Order.aggregate([
        { 
          $match: { 
            status: 'DELIVERED',
            deliveredAt: { $gte: lastMonth, $lt: startOfDay }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Active Orders (not delivered/cancelled)
      Order.countDocuments({
        status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING', 'PACKING', 'OUT_FOR_DELIVERY'] }
      }),

      // Urgent Orders (delivery today or overdue)
      Order.countDocuments({
        status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING', 'PACKING'] },
        deliveryDate: { $lte: endOfDay }
      }),

      // Active Shops
      ShopRequest.countDocuments({
        status: 'APPROVED',
        partnershipStatus: 'ACTIVE'
      }),

      // Pending Shop Requests
      ShopRequest.countDocuments({ status: 'PENDING' }),

      // Low Stock Products (below 20 units)
      Product.countDocuments({ currentStock: { $lt: 20 } }),

      // Critical Stock Products (below 5 units)
      Product.countDocuments({ currentStock: { $lt: 5 } }),

      // Items to Pack
      Order.countDocuments({
        status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING'] }
      }),

      // Ready for Delivery
      Order.countDocuments({ status: 'PACKING' }),

      // Completed Today
      Order.countDocuments({
        status: 'DELIVERED',
        deliveredAt: { $gte: startOfDay, $lt: endOfDay }
      }),

      // Recent Activity (last 20 activities)
      getRecentActivity(),

      // Urgent Orders List
      Order.find({
        status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING', 'PACKING'] },
        deliveryDate: { $lte: endOfDay }
      })
      .populate('shopRequestId', 'shopName')
      .sort({ deliveryDate: 1 })
      .limit(10)
      .lean(),

      // Pending Requests List
      ShopRequest.find({ status: 'PENDING' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Revenue Chart (last 7 days)
      getDailyRevenueChart(last7Days),

      // Order Status Distribution
      getOrderStatusDistribution()
    ]);

    // Calculate revenue trend
    const currentRevenue = totalRevenue[0]?.total || 0;
    const previousRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueTrend = previousRevenue > 0 
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    // Format urgent orders
    const formattedUrgentOrders = urgentOrdersList.map(order => ({
      _id: order._id,
      shopName: order.shopRequestId?.shopName || 'Unknown Shop',
      status: order.status,
      deliveryDate: order.deliveryDate,
      totalAmount: order.totalAmount
    }));

    // Get low stock products details
    const lowStockProductsList = await Product.find({ currentStock: { $lt: 20 } })
      .sort({ currentStock: 1 })
      .limit(10)
      .lean();

    const dashboardData = {
      metrics: {
        totalRevenue: currentRevenue,
        revenueTrend,
        activeOrders,
        urgentOrders,
        activeShops,
        pendingShopRequests,
        lowStockItems: lowStockProducts,
        criticalStockItems: criticalStockProducts
      },
      production: {
        itemsToPack,
        readyForDelivery,
        completedToday
      },
      recentActivity,
      urgentOrders: formattedUrgentOrders,
      pendingRequests: pendingRequestsList,
      lowStockProducts: lowStockProductsList,
      revenueChart,
      orderStatusChart
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching comprehensive dashboard:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

// Helper function to get recent activity
const getRecentActivity = async () => {
  try {
    const activities = [];

    // Recent orders
    const recentOrders = await Order.find()
      .populate('shopRequestId', 'shopName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentOrders.forEach(order => {
      activities.push({
        type: order.status,
        message: `New order from ${order.shopRequestId?.shopName || 'Unknown Shop'}`,
        timestamp: order.createdAt
      });
    });

    // Recent shop requests
    const recentRequests = await ShopRequest.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentRequests.forEach(request => {
      activities.push({
        type: request.status,
        message: `Shop request from ${request.shopName}`,
        timestamp: request.createdAt
      });
    });

    // Recent events
    const recentEvents = await EventRequest.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentEvents.forEach(event => {
      activities.push({
        type: event.status,
        message: `Event order: ${event.eventName}`,
        timestamp: event.createdAt
      });
    });

    // Sort by timestamp and return latest 15
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

// Helper function to get daily revenue chart
const getDailyRevenueChart = async (startDate) => {
  try {
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'DELIVERED',
          deliveredAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$deliveredAt' },
            month: { $month: '$deliveredAt' },
            day: { $dayOfMonth: '$deliveredAt' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Fill in missing days with 0 revenue
    const chartData = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = revenueData.find(item => {
        const itemDate = new Date(item._id.year, item._id.month - 1, item._id.day);
        return itemDate.toISOString().split('T')[0] === dateStr;
      });

      chartData.push({
        date: new Date(currentDate),
        revenue: existingData ? existingData.revenue : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return chartData;
  } catch (error) {
    console.error('Error getting revenue chart:', error);
    return [];
  }
};

// Helper function to get order status distribution
const getOrderStatusDistribution = async () => {
  try {
    const statusData = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalOrders = statusData.reduce((sum, item) => sum + item.count, 0);

    return statusData.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
    }));
  } catch (error) {
    console.error('Error getting order status distribution:', error);
    return [];
  }
};

const markAllNotificationsAsRead = async (req, res) => {
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

const getManufacturingDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Parallel data fetching for better performance
    const [
      pendingShopApprovals,
      ordersToPack,
      lowStockProducts,
      criticalStockProducts,
      activeShops,
      todaysOrders,
      pendingEvents,
      completedToday,
      todaysRevenue,
      allProducts,
      activeOrders
    ] = await Promise.all([
      // Pending shop approvals
      ShopRequest.countDocuments({ status: 'PENDING' }),

      // Orders to pack (PLACED, APPROVED, MANUFACTURING)
      Order.countDocuments({
        status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING'] }
      }),

      // Low stock items (below 20 units)
      Product.countDocuments({ currentStock: { $lt: 20 } }),

      // Critical stock items (below 5 units)
      Product.countDocuments({ currentStock: { $lt: 5 } }),

      // Active partner shops
      ShopRequest.countDocuments({
        status: 'APPROVED',
        partnershipStatus: 'ACTIVE'
      }),

      // Today's orders
      Order.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      }),

      // Pending events
      EventRequest.countDocuments({
        status: { $in: ['NEW', 'CONTACTED', 'ACCEPTED'] }
      }),

      // Completed today
      Order.countDocuments({
        status: 'DELIVERED',
        deliveredAt: { $gte: startOfDay, $lt: endOfDay }
      }),

      // Today's revenue
      Order.aggregate([
        {
          $match: {
            status: 'DELIVERED',
            deliveredAt: { $gte: startOfDay, $lt: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),

      // All products for inventory overview
      Product.find().lean(),

      // Active orders for manufacturing requirements
      Order.find({
        status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING', 'PACKING'] }
      }).populate('products.productId').lean()
    ]);

    // Calculate manufacturing requirements
    const manufacturingRequirements = calculateManufacturingRequirements(allProducts, activeOrders);

    // Get inventory overview (all products with stock status)
    const inventoryOverview = allProducts.map(product => ({
      name: product.name,
      currentStock: product.currentStock,
      minStock: product.minStock || 10,
      unit: product.unit
    })).sort((a, b) => a.currentStock - b.currentStock);

    const dashboardData = {
      pendingShopApprovals,
      ordersToPack,
      lowStockItems: lowStockProducts,
      criticalStockItems: criticalStockProducts,
      activeShops,
      todaysOrders,
      pendingEvents,
      completedToday,
      todaysRevenue: todaysRevenue[0]?.total || 0,
      manufacturingRequirements,
      inventoryOverview
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching manufacturing dashboard:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

// Helper function to calculate manufacturing requirements
const calculateManufacturingRequirements = (allProducts, activeOrders) => {
  const requirements = {};

  // Initialize with all products
  allProducts.forEach(product => {
    requirements[product._id.toString()] = {
      productName: product.name,
      currentStock: product.currentStock,
      totalOrdered: 0,
      unit: product.unit
    };
  });

  // Calculate total ordered quantities
  activeOrders.forEach(order => {
    order.products.forEach(item => {
      const productId = item.productId?._id?.toString() || item.productId?.toString();
      if (requirements[productId]) {
        requirements[productId].totalOrdered += item.quantity;
      }
    });
  });

  // Calculate what needs to be manufactured
  const manufacturingList = Object.values(requirements).map(item => ({
    ...item,
    toManufacture: Math.max(0, item.totalOrdered - item.currentStock)
  }));

  // Sort by manufacturing priority (highest need first)
  return manufacturingList.sort((a, b) => b.toManufacture - a.toManufacture);
};

module.exports = {
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
};
