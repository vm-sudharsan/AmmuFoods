const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    shopUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    deliveryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["PLACED", "APPROVED", "PACKED", "DELIVERED"],
      default: "PLACED",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
