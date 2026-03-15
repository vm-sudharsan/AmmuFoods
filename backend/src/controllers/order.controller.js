const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const { User } = require("../models/User.model");
const { createAuditLog } = require("../services/audit.service");
const { createNotification, notifyAdmins } = require("../services/notification.service");
const { sendDailyOrderNotification, sendOrderStatusEmail, sendMail } = require("../services/mail.service");

/**
 * Validate that delivery date is in the future
 */
const validateFutureDate = (deliveryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderDate = new Date(deliveryDate);
  orderDate.setHours(0, 0, 0, 0);

  return orderDate >= today;
};

/**
 * SHOP: Place daily order (any future date)
 */
const placeOrder = async (req, res) => {
  try {
    const { products, deliveryDate, deliveryAddress, contactNumber, preferredDeliveryTime } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products are required",
      });
    }

    if (!deliveryDate) {
      return res.status(400).json({
        success: false,
        message: "Delivery date is required",
      });
    }

    // Validate future date
    if (!validateFutureDate(deliveryDate)) {
      return res.status(400).json({
        success: false,
        message: "Delivery date must be today or in the future",
      });
    }

    // Get shop user details
    const shopUser = await User.findById(req.user._id);
    if (!shopUser || shopUser.role !== "SHOP") {
      return res.status(403).json({
        success: false,
        message: "Only shop partners can place daily orders",
      });
    }

    // Get shop request details for shop name
    const ShopRequest = require('../models/ShopRequest.model');
    const shopRequest = await ShopRequest.findOne({ 
      userId: req.user._id, 
      status: 'APPROVED' 
    });

    if (!shopRequest) {
      return res.status(403).json({
        success: false,
        message: "No approved shop partnership found",
      });
    }

    // Validate and enrich products
    const enrichedProducts = [];
    let totalAmount = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      
      if (!product || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} is not available`,
        });
      }

      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      const totalPrice = product.pricePerUnit * item.quantity;
      totalAmount += totalPrice;

      enrichedProducts.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        pricePerUnit: product.pricePerUnit,
        totalPrice,
        unit: product.unit || 'piece',
      });
    }

    // Create order with shop name from ShopRequest
    const order = await Order.create({
      shopId: req.user._id,
      shopRequestId: shopRequest._id,
      shopName: shopRequest.shopName,  // Use shop name, not account name
      orderType: 'SHOP',
      deliveryDate: new Date(deliveryDate),
      deliveryTime: preferredDeliveryTime || shopRequest.preferredDeliveryTime || '10:00 AM',
      products: enrichedProducts,
      totalAmount,
      deliveryAddress: deliveryAddress || shopRequest.shopAddress,  // Fixed: use shopAddress
      contactPerson: shopRequest.shopOwnerName,  // Fixed: use shopOwnerName
      contactNumber: contactNumber || shopRequest.contactNumber,
      preferredDeliveryTime,
      status: "PLACED",
      statusHistory: [
        {
          status: "PLACED",
          timestamp: new Date(),
          updatedBy: req.user._id,
          notes: 'Order placed by shop',
        },
      ],
    });

    // Update shop request with order history
    shopRequest.totalOrders = (shopRequest.totalOrders || 0) + 1;
    // Note: totalRevenue is updated only when order is DELIVERED, not when placed
    if (!shopRequest.orderHistory) {
      shopRequest.orderHistory = [];
    }
    shopRequest.orderHistory.push({
      orderId: order._id,
      orderDate: new Date(),
      deliveryDate: order.deliveryDate,
      status: 'PLACED',
      totalAmount: totalAmount,
    });
    await shopRequest.save();

    // Notify admins about new order
    try {
      await notifyAdmins(
        'ORDER',
        `New order from ${shopRequest.shopName} for ${new Date(deliveryDate).toLocaleDateString()}`,
        'MEDIUM',
        {
          shopName: shopRequest.shopName,
          orderId: order._id.toString().slice(-6).toUpperCase(),
          deliveryDate: new Date(deliveryDate).toLocaleDateString(),
          totalAmount: `₹${totalAmount}`,
          itemCount: enrichedProducts.length
        }
      );
    } catch (notifError) {
      console.error('Failed to notify admins about new order:', notifError);
    }

    // Create audit log
    await createAuditLog({
      userId: req.user._id,
      action: "ORDER_PLACED",
      entityType: "Order",
      entityId: order._id,
      changes: {
        after: {
          shopName: order.shopName,
          products: enrichedProducts,
          deliveryDate: order.deliveryDate,
          totalAmount,
        },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    // Send email to admin
    await sendDailyOrderNotification(order);

    // Send confirmation email to shop user
    try {
      const productsHtml = enrichedProducts
        .map(p => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.quantity} ${p.unit}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${p.pricePerUnit}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${p.totalPrice}</td>
          </tr>
        `).join('');

      await sendMail({
        to: shopUser.email,
        subject: "Order Confirmation - Ammu Foods",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Order Placed Successfully</h2>
            <p>Dear ${shopRequest.shopOwnerName},</p>
            <p>Your order has been placed successfully!</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Order ID:</strong> ${order._id.toString().slice(-8).toUpperCase()}</p>
              <p><strong>Shop Name:</strong> ${shopRequest.shopName}</p>
              <p><strong>Delivery Date:</strong> ${new Date(deliveryDate).toLocaleDateString()}</p>
              <p><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
              <p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>
            </div>
            <h3 style="color: #333;">Order Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Price/Unit</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
              ${productsHtml}
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="3" style="padding: 12px; text-align: right; border-top: 2px solid #ddd;">Total Amount:</td>
                <td style="padding: 12px; border-top: 2px solid #ddd;">₹${totalAmount}</td>
              </tr>
            </table>
            <p>Your order will be prepared and delivered on the scheduled date.</p>
            <p>You can track your order status by logging into your account.</p>
            <p style="margin-top: 30px;">Thank you for your business!<br><strong>Ammu Foods Team</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email to shop:', emailError);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

/**
 * SHOP: Get my order history
 */
const getMyOrders = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const query = { shopId: req.user._id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/**
 * ADMIN: Get all orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, deliveryDate, shopId, orderType, search, limit = 50, skip = 0 } = req.query;
    const query = {};

    if (status) {
      // Handle multiple statuses separated by comma
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    if (shopId) {
      query.shopId = shopId;
    }

    if (orderType) {
      query.orderType = orderType;
    }

    if (deliveryDate) {
      const date = new Date(deliveryDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      query.deliveryDate = { $gte: date, $lt: nextDay };
    }

    // Search by shop name or order ID
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
      ].filter(condition => condition._id !== null);
    }

    const orders = await Order.find(query)
      .populate("shopId", "name email")
      .populate("shopRequestId", "shopName shopOwnerName shopAddress area contactNumber alternateContact preferredDeliveryTime")
      .populate("eventId", "eventName eventDate")
      .populate({
        path: "products.productId",
        select: "name unit"
      })
      .sort({ deliveryDate: 1, deliveryTime: 1, priority: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/**
 * ADMIN: Get manufacturing plan for a specific date
 * Returns product-wise totals for manufacturing
 */
const getManufacturingPlan = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Aggregate orders by product
    const productTotals = await Order.aggregate([
      {
        $match: {
          deliveryDate: { $gte: targetDate, $lt: nextDay },
          status: { $in: ["PLACED", "APPROVED", "PACKED"] },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.productId",
          productName: { $first: "$products.productName" },
          totalQuantity: { $sum: "$products.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
    ]);

    res.json({
      success: true,
      date: targetDate,
      productTotals,
      totalProducts: productTotals.length,
    });
  } catch (error) {
    console.error("Get manufacturing plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manufacturing plan",
    });
  }
};

/**
 * ADMIN: Get shop-wise packing list for a specific date
 * Returns orders grouped by shop for packing and delivery
 */
const getPackingList = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const orders = await Order.find({
      deliveryDate: { $gte: targetDate, $lt: nextDay },
      status: { $in: ["PLACED", "APPROVED", "PACKED", "OUT_FOR_DELIVERY"] },
    })
      .populate("shopId", "name email")
      .sort({ preferredDeliveryTime: 1, shopName: 1 });

    const packingList = orders.map((order) => ({
      orderId: order._id,
      shopId: order.shopId._id,
      shopName: order.shopName,
      shopEmail: order.shopId.email,
      products: order.products,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      contactNumber: order.contactNumber,
      preferredDeliveryTime: order.preferredDeliveryTime,
      status: order.status,
    }));

    res.json({
      success: true,
      date: targetDate,
      packingList,
      totalOrders: packingList.length,
    });
  } catch (error) {
    console.error("Get packing list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packing list",
    });
  }
};

/**
 * ADMIN: Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ["PLACED", "APPROVED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findById(req.params.id).populate("shopId", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const oldStatus = order.status;

    // Update status
    order.status = status;
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: adminNotes || `Status changed to ${status}`,
    });

    await order.save();

    // Handle status-specific logic
    if (status === 'DELIVERED' && oldStatus !== 'DELIVERED') {
      // Deduct stock for each product when delivered
      for (const item of order.products) {
        try {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { currentStock: -item.quantity } },
            { new: true }
          );
        } catch (stockError) {
          console.error(`Failed to update stock for product ${item.productId}:`, stockError);
          // Continue with other products even if one fails
        }
      }

      // Update shop request revenue (only count delivered orders)
      if (order.shopRequestId) {
        const ShopRequest = require('../models/ShopRequest.model');
        try {
          await ShopRequest.findByIdAndUpdate(
            order.shopRequestId,
            { $inc: { totalRevenue: order.totalAmount } }
          );
        } catch (revenueError) {
          console.error('Failed to update shop revenue:', revenueError);
        }
      }
    }

    // Handle cancellation
    if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      // Notify shop owner about cancellation
      await createNotification(
        order.shopId._id,
        "ORDER",
        `Your order #${order._id.toString().slice(-6)} has been cancelled`,
        "HIGH",
        {
          relatedId: order._id,
          relatedType: "Order",
          reason: adminNotes || 'No reason provided'
        }
      );
    }

    // Update shop request order history
    if (order.shopRequestId) {
      const ShopRequest = require('../models/ShopRequest.model');
      const shopRequest = await ShopRequest.findById(order.shopRequestId);
      
      if (shopRequest && shopRequest.orderHistory) {
        const orderHistoryIndex = shopRequest.orderHistory.findIndex(
          oh => oh.orderId.toString() === order._id.toString()
        );
        
        if (orderHistoryIndex !== -1) {
          shopRequest.orderHistory[orderHistoryIndex].status = status;
          await shopRequest.save();
        }
      }
    }

    // Create audit log
    await createAuditLog({
      userId: req.user._id,
      action: "ORDER_STATUS_CHANGED",
      entityType: "Order",
      entityId: order._id,
      changes: {
        before: { status: oldStatus },
        after: { status },
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        notes: adminNotes,
      },
    });

    // Notify shop owner
    await createNotification(
      order.shopId._id,
      "ORDER",
      `Your order #${order._id.toString().slice(-6)} status: ${status}`,
      "HIGH",
      {
        relatedId: order._id,
        relatedType: "Order",
      }
    );

    // Send email to shop with detailed status
    const statusMessages = {
      'APPROVED': 'Your order has been approved and will be prepared soon.',
      'MANUFACTURING': 'Your order is now being manufactured.',
      'PACKING': 'Your order is being packed and will be dispatched soon.',
      'OUT_FOR_DELIVERY': 'Your order is out for delivery!',
      'DELIVERED': 'Your order has been delivered successfully.',
      'CANCELLED': 'Your order has been cancelled.',
    };

    try {
      const { sendMail } = require('../services/mail.service');
      await sendMail({
        to: order.shopId.email,
        subject: `Order Status Update - ${order.shopName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Order Status Update</h2>
            <p>Dear ${order.shopName},</p>
            <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Order Details:</h3>
              <p><strong>Order ID:</strong> #${order._id.toString().slice(-6)}</p>
              <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">${status}</span></p>
              <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>
              <p><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
            </div>

            ${adminNotes ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Admin Notes:</h3>
                <p>${adminNotes}</p>
              </div>
            ` : ''}

            <p>Thank you for your business!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Ammu Foods Team</strong>
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

/**
 * Get single order details
 */
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("shopId", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check authorization
    if (req.user.role === "SHOP" && order.shopId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

/**
 * Get manufacturing statistics (daily and monthly)
 */
getManufacturingStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get all products for structure
    const Product = require('../models/Product.model');
    const products = await Product.find({ isAvailable: true }).lean();

    // Daily manufacturing (today and tomorrow)
    const dailyOrders = await Order.find({
      deliveryDate: { $gte: today, $lt: tomorrow.setDate(tomorrow.getDate() + 1) },
      status: { $in: ['APPROVED', 'MANUFACTURING', 'PACKING'] }
    }).lean();

    // Monthly manufacturing (next 30 days)
    const monthlyOrders = await Order.find({
      deliveryDate: { $gte: today, $lte: thirtyDaysFromNow },
      status: { $in: ['PLACED', 'APPROVED', 'MANUFACTURING', 'PACKING'] }
    }).lean();

    // Calculate daily requirements
    const dailyRequirements = {};
    dailyOrders.forEach(order => {
      order.products.forEach(item => {
        if (!dailyRequirements[item.productName]) {
          dailyRequirements[item.productName] = {
            quantity: 0,
            unit: item.unit || 'piece'
          };
        }
        dailyRequirements[item.productName].quantity += item.quantity;
      });
    });

    // Calculate monthly requirements
    const monthlyRequirements = {};
    monthlyOrders.forEach(order => {
      order.products.forEach(item => {
        if (!monthlyRequirements[item.productName]) {
          monthlyRequirements[item.productName] = {
            quantity: 0,
            unit: item.unit || 'piece'
          };
        }
        monthlyRequirements[item.productName].quantity += item.quantity;
      });
    });

    res.json({
      success: true,
      daily: dailyRequirements,
      monthly: monthlyRequirements,
      dailyOrderCount: dailyOrders.length,
      monthlyOrderCount: monthlyOrders.length,
    });
  } catch (error) {
    console.error("Get manufacturing stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manufacturing statistics",
    });
  }
};

/**
 * Get packing list (orders ready for packing)
 */
getPackingListOrders = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {
      status: { $in: ['PACKING', 'OUT_FOR_DELIVERY'] }
    };

    // Search by shop name or order ID
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
      ].filter(condition => condition._id !== null);
    }

    const orders = await Order.find(query)
      .populate("shopId", "name email")
      .populate("eventId", "eventName eventDate eventLocation")
      .sort({ priority: 1, deliveryDate: 1, deliveryTime: 1 })
      .lean();

    // Separate into event and shop orders
    const eventOrders = orders.filter(o => o.orderType === 'EVENT');
    const shopOrders = orders.filter(o => o.orderType === 'SHOP');

    res.json({
      success: true,
      eventOrders,
      shopOrders,
      total: orders.length,
    });
  } catch (error) {
    console.error("Get packing list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packing list",
    });
  }
};

/**
 * Mark order as printed
 */
markOrderPrinted = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.isPrinted = true;
    order.printedAt = new Date();
    order.printedBy = req.user._id;
    await order.save();

    res.json({
      success: true,
      message: "Order marked as printed",
      order,
    });
  } catch (error) {
    console.error("Mark order printed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as printed",
    });
  }
};

/**
 * Search orders
 */
searchOrders = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const query = {
      $or: [
        { shopName: { $regex: q, $options: 'i' } },
        { _id: q.match(/^[0-9a-fA-F]{24}$/) ? q : null },
      ].filter(condition => condition._id !== null)
    };

    const orders = await Order.find(query)
      .populate("shopId", "name email")
      .populate("eventId", "eventName")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Search orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search orders",
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getManufacturingPlan,
  getPackingList,
  updateOrderStatus,
  getOrder,
  getManufacturingStats,
  getPackingListOrders,
  markOrderPrinted,
  searchOrders,
};
