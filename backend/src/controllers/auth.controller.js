const { verifyGoogleToken } = require("../config/oauth");
const { User } = require("../models/User.model");
const { signToken } = require("../utils/jwt.util");

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
      });
    }

    const jwtToken = signToken({ id: user._id });

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
    });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed" });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

const logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

module.exports = { googleLogin, me, logout };
