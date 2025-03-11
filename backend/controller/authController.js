const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/users");
const { ROLES } = require("../config/constant");
require("dotenv").config();
// Store refresh tokens (temporary, recommend using Redis in production)
const refreshTokens = new Set();

// Register
exports.register = async (req, res) => {
  try {
    const { username, name, email, mobileNumber, password } = req.body;

    // Convert email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      name,
      email: normalizedEmail,
      mobileNumber,
      password: hashedPassword,
      roles: [ROLES.Users], // Default role assigned as an array
      status: "inactive",
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.log("User not found.");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found:", user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password.");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Generating token...");
    console.log("JWT Secret:", process.env.JWT_SECRET);

    // Set access token expiration to 7 days
    const accessToken = jwt.sign(
      { userId: user.userId || user.id, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Generated Access Token:", accessToken);
    console.log("Decoded Access Token:", jwt.decode(accessToken));

    // Refresh token remains 7 days (no change needed)
    const refreshToken = jwt.sign(
      { userId: user.userId || user.id, roles: user.roles },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res
      .status(200)
      .json({ message: "Login successful", accessToken, refreshToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken; // Check body or cookie
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    refreshTokens.delete(refreshToken);
    res.clearCookie("refreshToken"); // Clear the cookie if using cookies
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // TODO: Send email with resetToken (For now, returning in response)
    res.status(200).json({ message: "Password reset link sent", resetToken });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.has(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      const newAccessToken = jwt.sign(
        { userId: user.userId, roles: user.roles },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
