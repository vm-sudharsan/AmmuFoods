const { verifyGoogleToken } = require("../config/oauth");
const { User } = require("../models/User.model");
const { generateToken } = require("../utils/jwt.util");
const { hashPassword, comparePassword } = require("../utils/password.util");

/**
 * Signup with Email/Password
 * - Creates new user with hashed password
 * - Email must be unique
 * - If email exists (from Google OAuth), adds password to existing account
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select("+password");
    
    if (existingUser) {
      // If user exists with Google OAuth but no password, add password
      if (existingUser.googleId && !existingUser.password) {
        const hashedPassword = await hashPassword(password);
        
        existingUser.password = hashedPassword;
        if (name && name !== existingUser.name) {
          existingUser.name = name; // Update name if provided
        }
        await existingUser.save();

        const jwtToken = generateToken(existingUser._id, existingUser.role);

        res.cookie("token", jwtToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return res.status(200).json({
          message: "Password added to your account successfully",
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
          },
          token: jwtToken,
        });
      }
      
      // User already has an account with password
      return res.status(400).json({ 
        message: "Email already registered. Please login instead." 
      });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const jwtToken = generateToken(user._id, user.role);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: jwtToken,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Checking if user has password (might be google only)
    if (!user.password) {
      return res.status(401).json({ message: "Please login with Google" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const jwtToken = generateToken(user._id, user.role);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: jwtToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Google OAuth Login
 * - Verifies Google token
 * - Creates new user if doesn't exist
 * - Links Google account to existing email/password account
 * - Same email = same account (unified authentication)
 */
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);

    // Find user by email (not just googleId)
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new user with Google OAuth
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
      });
    } else {
      // User exists - link Google account if not already linked
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
      
      // Update name if Google provides a different name
      if (payload.name && payload.name !== user.name) {
        user.name = payload.name;
        await user.save();
      }
    }

    const jwtToken = generateToken(user._id, user.role);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: jwtToken,
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(401).json({ 
      message: "Google authentication failed. Please try again." 
    });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

const logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

module.exports = { googleLogin, me, logout, signup, login };
