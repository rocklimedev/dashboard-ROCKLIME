const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/users");
const { ROLES } = require("../config/constant");

// Store refresh tokens (temporary, recommend using Redis in production)
const refreshTokens = new Set();

// Register
exports.register = async (req, res) => {
  try {
    const { username, name, email, mobileNumber, password, roles } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role to USERS if none is assigned
    const assignedRoles = roles && roles.length ? roles : [ROLES.Users];

    // Check if trying to assign SUPER_ADMIN (must be unique)
    if (assignedRoles.includes(ROLES.SuperAdmin)) {
      const superAdminExists = await User.findOne({
        where: { roles: { [Op.contains]: [ROLES.SuperAdmin] } },
      });

      if (superAdminExists) {
        return res.status(400).json({ message: "SuperAdmin already exists" });
      }
    }

    const newUser = await User.create({
      username,
      name,
      email,
      mobileNumber,
      password: hashedPassword,
      roles: assignedRoles,
      status: assignedRoles.includes(ROLES.Users) ? "inactive" : "active",
    });

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { userId: user.userId, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId, roles: user.roles },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    refreshTokens.add(refreshToken);

    res.status(200).json({ message: "Login successful", accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    refreshTokens.delete(refreshToken);
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
    const resetToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

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
