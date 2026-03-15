const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for shop-specific queries
    },

    shopRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopRequest",
      index: true,
    },

    shopName: {
      type: String,
      required: true, // Denormalized for performance
    },

    orderType: {
      type: String,
      enum: ["SHOP", "EVENT"],
      default: "SHOP",
      index: true,
    },

    // For event orders
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRequest",
    },

    deliveryDate: {
      type: Date,
      required: true,
      index: true, // Index for date-based queries (manufacturing report)
    },

    deliveryTime: {
      type: String,
      required: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: {
          type: String,
          required: true, // Denormalized for performance
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        pricePerUnit: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true, // quantity * pricePerUnit
        },
        unit: {
          type: String,
          default: "piece",
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true, // Sum of all product totalPrices
    },

    status: {
      type: String,
      enum: ["PLACED", "APPROVED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "PLACED",
      index: true, // Index for status filtering
    },

    deliveryAddress: {
      type: String,
      required: true,
    },

    contactPerson: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
    },

    preferredDeliveryTime: {
      type: String,
    },

    adminNotes: {
      type: String,
    },

    // Priority for packing list (lower = higher priority)
    priority: {
      type: Number,
      default: 0,
    },

    // Print tracking
    isPrinted: {
      type: Boolean,
      default: false,
    },

    printedAt: {
      type: Date,
    },

    printedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Tracking
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
orderSchema.index({ shopId: 1, createdAt: -1 }); // Shop order history
orderSchema.index({ deliveryDate: 1, status: 1 }); // Manufacturing report
orderSchema.index({ status: 1, createdAt: -1 }); // Admin order management
orderSchema.index({ orderType: 1, status: 1 }); // Filter by type and status
orderSchema.index({ deliveryDate: 1, deliveryTime: 1, priority: 1 }); // Packing list sorting

// Calculate priority before saving (Mongoose 6+ doesn't need next parameter)
orderSchema.pre('save', function() {
  if (this.isModified('deliveryDate') || this.isModified('orderType') || this.isNew) {
    const now = new Date();
    const delivery = new Date(this.deliveryDate);
    const daysUntilDelivery = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
    
    // Calculate priority (lower = more urgent)
    this.priority = 
      (daysUntilDelivery * -10) +                    // Negative days = urgent
      (this.orderType === 'EVENT' ? -20 : 0) +       // Events higher priority
      (this.totalAmount / 1000);                     // Larger orders slightly higher
  }
});

module.exports = mongoose.model("Order", orderSchema);
