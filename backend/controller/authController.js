const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/users");
const Roles = require("../models/roles");
const { ROLES } = require("../config/constant");
const emails = require("../middleware/sendMail");
const VerificationToken = require("../models/verificationToken"); // MongoDB model
require("dotenv").config();

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

    const verificationToken = jwt.sign(
      { userId: newUser.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    await VerificationToken.create({
      userId: newUser.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Use sendMail directly with the accountVerificationEmail template
    const emailContent = emails.accountVerificationEmail(
      req.headers.host,
      verificationToken
    );
    await emails.sendMail(
      newUser.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
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
    const { token } = req.params; // Token from URL

    const verificationToken = await VerificationToken.findOne({ token });
    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (verificationToken.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.status = "active";
    await user.save();

    verificationToken.isVerified = true;
    await verificationToken.save();

    req.email = {
      to: user.email,
      params: [user.name],
    };

    // after verifying account
    const emailContent = emails.accountVerificationConfirmationEmail(user.name);
    await emails.sendMail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );

    res.status(200).json({
      message: "Account verified successfully",
      isVerified: true,
      email: user.email,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      await VerificationToken.deleteOne({ token });
      return res.status(400).json({ message: "Token has expired" });
    }
    next(err);
  }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const resetToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    await VerificationToken.create({
      userId: user.userId,
      token: resetToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    req.email = {
      to: user.email,
      params: [req.headers.host, resetToken],
    };

    const emailContent = emails.resetEmail(req.headers.host, resetToken);
    await emails.sendMail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );

    res
      .status(200)
      .json({ message: "Password reset link sent", token: resetToken });
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
    const { resetToken, newPassword, email } = req.body;
    if (!resetToken || !newPassword || !email) {
      return res
        .status(400)
        .json({ message: "Token, email, and new password are required" });
    }

    // Find verification token in database
    const verificationToken = await VerificationToken.findOne({
      where: { token: resetToken, email, isVerified: false },
    });

    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid or used token" });
    }

    // Check token expiration
    if (verificationToken.expiresAt < new Date()) {
      await verificationToken.destroy();
      return res.status(400).json({ message: "Token has expired" });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        await verificationToken.destroy();
        return res.status(400).json({ message: "Token has expired" });
      }
      throw err;
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || user.email !== email) {
      return res.status(400).json({ message: "Invalid token or email" });
    }

    // Validate password strength (optional, adjust as needed)
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Mark token as used
    verificationToken.isVerified = true;
    await verificationToken.save();

    // Send confirmation email
    const emailContent = emails.confirmResetPasswordEmail();
    await emails.sendMail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    next(err);
  }
};

// Validate Reset Token
exports.validateResetToken = async (req, res) => {
  const { token } = req.params;
  try {
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Find verification token in database
    const verificationToken = await VerificationToken.findOne({
      where: { token, isVerified: false },
    });

    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid or used token" });
    }

    // Check token expiration
    if (verificationToken.expiresAt < new Date()) {
      await verificationToken.destroy();
      return res.status(400).json({ message: "Token has expired" });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        await verificationToken.destroy();
        return res.status(400).json({ message: "Token has expired" });
      }
      throw err;
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || user.email !== verificationToken.email) {
      return res.status(400).json({ message: "Invalid token or email" });
    }

    res.json({ email: user.email });
  } catch (error) {
    console.error("Validate reset token error:", error);
    res
      .status(400)
      .json({ message: error.message || "Invalid or expired reset link" });
  }
};

// Login, Logout, Refresh Token, and Resend Verification Email remain unchanged
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Account is inactive. Please verify your account." });
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
        iat: now,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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

exports.logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

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

exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.status === "active") {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // Delete any existing verification tokens for this user
    await VerificationToken.destroy({ where: { userId: user.userId } });

    // Generate a new verification token
    const verificationToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Save the new verification token
    await VerificationToken.create({
      userId: user.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send the verification email
    const emailContent = emails.accountVerificationEmail(
      req.headers.host,
      verificationToken
    );
    await emails.sendMail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (err) {
    next(err);
  }
};
