const mongoose = require("mongoose");

const eventRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventName: String,

    contactPerson: String,

    contactNumber: String,

    eventLocation: String,

    itemsRequired: String,

    approxQuantity: String,

    eventDate: Date,

    deliveryTime: String,

    notes: String,

    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "CLOSED"],
      default: "NEW",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EventRequest", eventRequestSchema);
