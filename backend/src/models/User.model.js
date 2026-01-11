const mongoose = require("mongoose");

const USER_ROLES = {
  USER: "USER",
  SHOP: "SHOP",
  ADMIN: "ADMIN",
  DEVELOPER_ADMIN: "DEVELOPER_ADMIN",
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    googleId: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  User: mongoose.model("User", userSchema),
  USER_ROLES,
};
