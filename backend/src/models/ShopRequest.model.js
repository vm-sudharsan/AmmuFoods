const mongoose = require("mongoose");

const shopRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },

    userName: {
      type: String,
      required: true, // Denormalized for performance
    },

    userEmail: {
      type: String,
      required: true, // Denormalized for performance
    },

    // Shop Information
    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    shopOwnerName: {
      type: String,
      required: true,
      trim: true,
    },

    businessDetails: {
      type: String,
      trim: true, // GST, license info
    },

    // Location Details
    shopAddress: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact Information
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    alternateContact: {
      type: String,
      trim: true,
    },

    // Business Details
    dailyStockNeeded: {
      type: String,
      required: true,
      trim: true,
    },

    preferredDeliveryTime: {
      type: String,
      trim: true,
    },

    productsInterested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    additionalNotes: {
      type: String,
      trim: true,
    },

    // Status Management
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "CANCELLATION_REQUESTED"],
      default: "PENDING",
      index: true, // Index for filtering
    },

    partnershipStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "CANCELLED", "CANCELLATION_PENDING"],
      default: null,
    },

    partnershipStartDate: {
      type: Date,
    },

    partnershipEndDate: {
      type: Date,
    },

    adminNotes: {
      type: String,
      trim: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    cancellationRequestedBy: {
      type: String,
      enum: ["ADMIN", "SHOP"],
    },

    cancellationRequestedAt: {
      type: Date,
    },

    // Approval tracking
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    // Order history tracking
    orderHistory: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      orderDate: Date,
      deliveryDate: Date,
      status: String,
      totalAmount: Number,
    }],

    totalOrders: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + status queries
shopRequestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("ShopRequest", shopRequestSchema);
