const mongoose = require("mongoose");

const eventRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for user-specific queries
    },

    userName: {
      type: String,
      required: true, // Denormalized for performance
    },

    userEmail: {
      type: String,
      required: true, // Denormalized for performance
    },

    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    secondaryContact: {
      type: String,
      trim: true,
    },

    eventLocation: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
      index: true, // Index for date-based queries
    },

    eventTime: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryTime: {
      type: String,
      required: true,
      trim: true,
    },

    guestCount: {
      type: Number,
      min: 1,
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
          required: true, // Denormalized
        },
        approximateQuantity: {
          type: Number,
          required: true,
        },
      },
    ],

    specialInstructions: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "ACCEPTED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "COMPLETED", "REJECTED"],
      default: "NEW",
      index: true, // Index for status filtering
    },

    adminNotes: {
      type: String,
      trim: true,
    },

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
eventRequestSchema.index({ userId: 1, createdAt: -1 }); // User event history
eventRequestSchema.index({ status: 1, eventDate: 1 }); // Admin event management
eventRequestSchema.index({ eventDate: 1, status: 1 }); // Upcoming events

module.exports = mongoose.model("EventRequest", eventRequestSchema);
