const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/users");
const Roles = require("../models/roles"); // Add Roles model
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

    // Check if the user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: normalizedEmail }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    // Fetch the "USERS" role from the Roles table
    const roleData = await Roles.findOne({ where: { roleName: ROLES.Users } });

    if (!roleData) {
      console.error("USERS role not found in Roles table");
      return res.status(400).json({ message: "USERS role not found" });
    }

    const roleId = roleData.roleId; // e.g., "0c3392e0-f416-407c-8699-e8638554eba9"
    const roleName = roleData.roleName; // "USERS"
    console.log("Fetched role:", { roleId, roleName }); // Debug

    // Alternative: Hardcode roleId for testing
    // const roleId = "0c3392e0-f416-407c-8699-e8638554eba9";
    // const roleName = ROLES.Users;

    // Validate roleId
    if (!roleId) {
      console.error("Invalid roleId:", roleId);
      return res.status(400).json({ message: "Invalid roleId for USERS role" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await User.create({
      username,
      name,
      email: normalizedEmail,
      mobileNumber,
      password: hashedPassword,
      roles: [roleName], // Store as array
      roleId, // Assign fetched or hardcoded roleId
      status: "inactive", // Consistent with original register
    });

    console.log("Created user:", {
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      roles: newUser.roles,
      roleId: newUser.roleId,
      status: newUser.status,
    }); // Debug

    res.status(201).json({
      message: "User registered successfully",
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
    console.error("Register error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    // Find user with case-insensitive email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.log("User not found.");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found:", {
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      roleId: user.roleId,
    });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password.");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is inactive
    if (user.status === "inactive") {
      console.log("User is inactive:", user.userId);
      return res.status(403).json({
        message: "Account is inactive. Please contact an administrator.",
      });
    }

    console.log("Generating tokens...");
    console.log("JWT Secret:", process.env.JWT_SECRET);

    // Generate access token (7 days expiration)
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
        iat: now,
        exp: now + 7 * 24 * 60 * 60, // 7 days
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

    console.log("Generated Access Token:", accessToken);
    console.log("Decoded Access Token:", jwt.decode(accessToken));
    console.log("Generated Refresh Token:", refreshToken);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    console.error("Login error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
// Logout
exports.logout = async (req, res) => {
  try {
    console.log("Logout request received:");
    console.log("Cookies:", req.cookies);
    console.log("Body:", req.body);

    // Clear the access token cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
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
