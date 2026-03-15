const bcrypt = require("bcryptjs");

/**
 * Hash a password using bcrypt with 10 salt rounds
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If password is empty or hashing fails
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password to compare
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @throws {Error} If password or hashedPassword is invalid
 */
const comparePassword = async (password, hashedPassword) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  if (!hashedPassword || typeof hashedPassword !== "string") {
    throw new Error("Hashed password must be a non-empty string");
  }

  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

module.exports = {
  hashPassword,
  comparePassword,
};
