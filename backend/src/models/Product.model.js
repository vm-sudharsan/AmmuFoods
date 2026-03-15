const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index for search functionality
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      trim: true,
      index: true, // Index for category filtering
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    // Stock management
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    minimumStockLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },

    // Cloudinary image storage
    imageUrl: {
      type: String,
      required: false, // Optional for initial setup
    },

    imagePublicId: {
      type: String, // Cloudinary public_id for deletion
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering available products
    },
  },
  {
    timestamps: true,
  }
);

// Text index for product search
productSchema.index({ name: "text", description: "text" });

// Compound indexes for common queries
productSchema.index({ isAvailable: 1, createdAt: -1 });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ currentStock: 1 }); // For low stock alerts

module.exports = mongoose.model("Product", productSchema);
