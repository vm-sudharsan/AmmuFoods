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
      index: true, // Already exists
    },

    googleId: {
      type: String,
      required: false,
      sparse: true, // Allow multiple null values
      index: true, // Index for OAuth lookups
    },

    password: {
      type: String,
      required: false,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      index: true, // Index for role-based queries
    },

    phone: {
      type: String,
      required: false,
      trim: true,
    },

    profilePicture: {
      type: String,
      required: false,
    },

    profilePicturePublicId: {
      type: String,
      required: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering active users
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for common queries
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });

module.exports = {
  User: mongoose.model("User", userSchema),
  USER_ROLES,
};
