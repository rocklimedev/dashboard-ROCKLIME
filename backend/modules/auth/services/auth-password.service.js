const {
  bcrypt,
  jwt,
  User,
  VerificationToken,
  emails,
  ActivityLog,
  logActivity,
  ROLES,
} = require("./auth.helpers");

// Verify Account
exports.verifyAccount = async (req, res, next) => {
  try {
    const { token } = req.params;

    const verificationToken = await VerificationToken.findOne({ token });
    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (verificationToken.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (verificationToken.expiresAt < new Date()) {
      await VerificationToken.deleteOne({ token });
      return res.status(400).json({ message: "Token has expired" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        await VerificationToken.deleteOne({ token });
        return res.status(400).json({ message: "Token has expired" });
      }
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.isEmailVerified = true;
    user.status = "active";
    await user.save();

    verificationToken.isVerified = true;
    await verificationToken.save();
    logActivity({
      userId: user.userId,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "ACCOUNT_VERIFIED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `Account verified for user "${user.username}"`,

      oldValues: {
        isEmailVerified: false,
        status: "inactive",
      },

      newValues: {
        isEmailVerified: true,
        status: "active",
      },

      metadata: {
        email: user.email,
        verificationTokenId:
          verificationToken.id || verificationToken._id || null,
      },

      req,
    }).catch(console.error);
    const emailContent = emails.accountVerificationConfirmationEmail(user.name);
    await emails.sendMail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html,
    );

    res.status(200).json({
      message: "Account verified successfully",
      isVerified: true,
      email: user.email,
    });
  } catch (err) {
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
      },
    );

    await VerificationToken.create({
      userId: user.userId,
      token: resetToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    });

    req.email = {
      to: user.email,
      params: [req.headers.host, resetToken],
    };

    const emailContent = emails.resetEmail(req.headers.host, resetToken);
    await emails
      .sendMail(
        user.email,
        emailContent.subject,
        emailContent.text,
        emailContent.html,
      )
      .catch(async (mailError) => {
        if (
          mailError.responseCode === 550 ||
          /No Such User/i.test(mailError.response)
        ) {
          // Optional: mark user as having invalid email
          await User.update(
            { emailVerified: false, hasBounced: true },
            { where: { userId: user.userId } },
          );

          // Or even delete the stale user if you're aggressive
          // await User.destroy({ where: { userId: user.userId } });
        }
        throw mailError; // still fail the request or handle gracefully
      });

    res
      .status(200)
      .json({ message: "Password reset link sent", token: resetToken });
  } catch (err) {
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
      emailContent.html,
    );

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
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

    const verificationToken = await VerificationToken.findOne({
      where: { token, isVerified: false },
    });

    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid or used token" });
    }

    if (verificationToken.expiresAt < new Date()) {
      await verificationToken.destroy();
      return res.status(400).json({ message: "Token has expired" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        await verificationToken.destroy();
        return res.status(400).json({ message: "Token has expired" });
      }
      return res.status(400).json({ message: `Invalid token: ${err.message}` });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || user.email !== verificationToken.email) {
      return res.status(400).json({ message: "Invalid token or email" });
    }

    res.json({ email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error during token validation" });
  }
};

exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Optional: Add stricter email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check isEmailVerified instead of status
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // Delete any existing verification tokens for this user using Mongoose
    await VerificationToken.deleteMany({ userId: user.userId });

    // Generate a new verification token
    const verificationToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Save the new verification token
    await VerificationToken.create({
      userId: user.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    });

    // Send the verification email
    const emailContent = emails.accountVerificationEmail(
      req.headers.host,
      verificationToken,
    );

    await emails.sendMail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html,
    );

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;

    // Validate input
    if (!password || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (password === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // Validate password strength (optional, adjust as needed)
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check if account is active
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ message: "Account is inactive or restricted" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedNewPassword;
    await user.save();

    // Activity Log
    logActivity({
      userId: user.userId,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "PASSWORD_CHANGED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `Password changed successfully for user "${user.username}"`,

      metadata: {
        email: user.email,
        changedBy: user.userId,
      },

      req,
    }).catch(console.error);

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.deactivateAccount = async (req, res, next) => {
  try {
    // Get user from token (set by auth middleware)
    const { userId } = req.user; // ← assuming auth middleware sets req.user

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "inactive") {
      return res
        .status(400)
        .json({ message: "Account is already deactivated" });
    }

    // Optional: Prevent deactivation for super admin
    if (user.roles.includes(ROLES.SuperAdmin)) {
      return res
        .status(403)
        .json({ message: "SuperAdmin account cannot be deactivated" });
    }

    // Soft deactivate
    user.status = "inactive";
    await user.save();
    // Activity Log
    logActivity({
      userId: user.userId,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "ACCOUNT_DEACTIVATED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `Account deactivated by user "${user.username}"`,

      oldValues: {
        status: oldStatus,
      },

      newValues: {
        status: "inactive",
      },

      metadata: {
        email: user.email,
        deactivatedBy: user.userId,
        selfDeactivated: true,
      },

      req,
    }).catch(console.error);

    res.status(200).json({
      message:
        "Account deactivated successfully. You can reactivate by logging in again.",
    });
  } catch (err) {
    next(err);
  }
};
