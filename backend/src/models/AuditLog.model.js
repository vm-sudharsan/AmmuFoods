const mongoose = require("mongoose");

/**
 * Audit Log Model
 * Tracks all critical business operations for compliance and debugging
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: [
        // Shop Request Actions
        "SHOP_REQUEST_SUBMITTED",
        "SHOP_REQUEST_APPROVED",
        "SHOP_REQUEST_REJECTED",
        
        // Order Actions
        "ORDER_PLACED",
        "ORDER_APPROVED",
        "ORDER_PACKED",
        "ORDER_DELIVERED",
        "ORDER_STATUS_CHANGED",
        
        // Product Actions
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "PRODUCT_DISABLED",
        
        // Event Actions
        "EVENT_REQUEST_SUBMITTED",
        "EVENT_STATUS_CHANGED",
        
        // User Actions
        "USER_ROLE_CHANGED",
        "USER_DEACTIVATED",
        "USER_ACTIVATED",
        
        // Auth Actions
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_SIGNUP",
      ],
      index: true,
    },

    // What entity was affected
    entityType: {
      type: String,
      required: true,
      enum: ["User", "Order", "Product", "ShopRequest", "EventRequest"],
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // What changed (before/after values)
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    // Additional context
    metadata: {
      ipAddress: String,
      userAgent: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 }); // User activity history
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 }); // Entity history
auditLogSchema.index({ action: 1, createdAt: -1 }); // Action-based queries
auditLogSchema.index({ createdAt: -1 }); // Recent activity

module.exports = mongoose.model("AuditLog", auditLogSchema);
