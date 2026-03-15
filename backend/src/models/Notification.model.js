const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for user-specific notifications
    },

    type: {
      type: String,
      enum: ["ORDER", "EVENT", "SHOP_REQUEST", "STOCK", "SYSTEM"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
      index: true, // Index for priority sorting
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true, // Index for filtering unread notifications
    },

    metadata: {
      relatedId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      relatedType: {
        type: String,
        enum: ["Order", "EventRequest", "ShopRequest", "Product"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
notificationSchema.index({ userId: 1, isRead: 1, priority: -1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
