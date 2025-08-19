// authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/users");
const Roles = require("../models/roles");
const { ROLES } = require("../config/constant");
const emails = require("../middleware/sendMail"); // Email templates
require("dotenv").config();
const VerificationToken = require("../models/verificationToken"); // MongoDB model
// Store refresh tokens (temporary, recommend using Redis in production)
const refreshTokens = new Set();

// Register
exports.register = async (req, res, next) => {
  try {
    const { username, name, email, mobileNumber, password } = req.body;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email: normalizedEmail }] },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    const roleData = await Roles.findOne({ where: { roleName: ROLES.Users } });
    if (!roleData) {
      return res.status(400).json({ message: "USERS role not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      name,
      email: normalizedEmail,
      mobileNumber,
      password: hashedPassword,
      roles: [roleData.roleName],
      roleId: roleData.roleId,
      status: "inactive",
    });

    // Create verification token
    const verificationToken = jwt.sign(
      { userId: newUser.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Save verification token in MongoDB
    await VerificationToken.create({
      userId: newUser.userId,
      token: verificationToken,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiration
    });

    // Send verification email
    await emails.accountVerificationEmail(
      newUser.email,
      "Account Verification",
      `Hi ${newUser.name},\n\nPlease verify your account by clicking this link:\n\nhttp://${req.headers.host}/api/auth/verify-account/${verificationToken}\n\nThanks!`
    );

    res.status(201).json({
      message: "User registered successfully. Verification email sent.",
      user: {
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        roles: newUser.roles,
        roleId: newUser.roleId,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
// Verify Account
exports.verifyAccount = async (req, res, next) => {
  try {
    const { token } = req.body; // Token sent from frontend via POST

    // Find token in MongoDB
    const verificationToken = await VerificationToken.findOne({ token });
    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check if already verified
    if (verificationToken.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Update user status to active in MySQL
    user.status = "active";
    await user.save();

    // Update verification token status in MongoDB
    verificationToken.isVerified = true;
    await verificationToken.save();

    // Set email details for verification confirmation email
    req.email = {
      to: user.email,
      params: [user.name], // Pass name to template
    };

    // Proceed to emailer middleware for confirmation email
    await emails.emailer(emails.accountVerificationConfirmationEmail)(
      req,
      res,
      () => {
        // Send response after email is processed
        res.status(200).json({
          message: "Account verified successfully",
          isVerified: true,
        });
      }
    );
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Remove expired token from MongoDB
      await VerificationToken.deleteOne({ token });
      return res.status(400).json({ message: "Token has expired" });
    }
    next(err);
  }
};
// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with case-insensitive email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is inactive
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Account is inactive. Please contact an administrator.",
      });
    }

    // Generate access token (7 days expiration)
    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
        iat: now,
        exp: now + 7 * 24 * 60 * 60,
      },
      process.env.JWT_SECRET
    );

    // Generate refresh token (7 days expiration)
    const refreshToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token
    refreshTokens.add(refreshToken);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        name: user.name,
        mobileNumber: user.mobileNumber,
        roles: user.roles,
        roleId: user.roleId,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Clear the access token cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log("ForgotPassword request body:", req.body); // Debug log
    console.log("Email value:", email, "Type:", typeof email); // Debug log

    // Validate email input
    if (!email || typeof email !== "string" || email.trim() === "") {
      console.log("Invalid email detected:", email);
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user with normalized email
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      console.log("User not found for email:", normalizedEmail);
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Set email details for password reset email
    req.email = {
      to: user.email,
      params: [req.headers.host, resetToken],
    };

    // Use emailer middleware and wait for it to complete
    await new Promise((resolve, reject) => {
      emails.emailer(emails.resetEmail)(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Send response only after email is sent
    res.status(200).json({ message: "Password reset link sent" });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Failed to send reset link", error: err.message });
    }
  }
};
// Reset Password
exports.resetPassword = async (req, res, next) => {
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

    // Set email details for password reset confirmation email
    req.email = {
      to: user.email,
      params: [],
    };

    // Proceed to emailer middleware
    next();

    // Send response immediately
    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
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
        { userId: user.userId, roles: user.roles, roleId: user.roleId },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
