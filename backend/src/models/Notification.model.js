const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    targetRole: {
      type: String,
      enum: ["ADMIN", "DEVELOPER_ADMIN"],
    },

    message: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "LOW",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
