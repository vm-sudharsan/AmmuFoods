const jwt = require("jsonwebtoken");

/**
 * Generate JWT token with user ID and role
 * @param {Object} payload - Token payload containing user ID and role
 * @param {string} payload.id - User ID
 * @param {string} payload.role - User role (USER, SHOP, ADMIN)
 * @returns {string} JWT token that expires in 7 days
 */
const generateToken = (userId, userRole) => {
  return jwt.sign(
    { id: userId, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload with id and role
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Legacy function for backward compatibility
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

module.exports = { generateToken, verifyToken, signToken };
