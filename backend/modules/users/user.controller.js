const userService = require("../services/userService");
const userUpdateService = require("../services/userUpdateService");
const userStatusService = require("../services/userStatusService");
const userRoleService = require("../services/userRoleService");
const userPhotoService = require("../services/userPhotoService");
const activityLogService = require("../services/activityLogService");

/**
 * GET /users/:userId
 * Get user profile with address
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.userId);
    res.status(200).json({ user });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({ message: err.message || "Server Error" });
  }
};

/**
 * POST /users
 * Create a new user
 */
exports.createUser = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);

    // Log activity
    const roleData = await require("../models").Role.findOne({
      where: { roleId: req.body.roleId },
    });
    await activityLogService.logUserCreated(
      newUser.userId,
      newUser,
      roleData,
      req.body.addressId,
      req,
    );

    const userData = await userService.getUserById(newUser.userId);
    res.status(201).json({
      message: "User created successfully",
      data: userData,
    });
  } catch (err) {
    const status = err.message.includes("already exists") ? 400 : 500;
    res.status(status).json({
      message: err.message || "Failed to create user",
    });
  }
};

/**
 * GET /users/search
 * Search users by query
 */
exports.searchUser = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const result = await userService.searchUsers(query, page, limit);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /users
 * Get all users with filters
 */
exports.getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * GET /users/:userId
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.status(200).json({ user });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({ message: err.message });
  }
};

/**
 * PUT /users/profile
 * Update user's own profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = await userUpdateService.updateProfile(
      req.user.userId,
      req.body,
    );
    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    const status =
      err.message === "User not found"
        ? 404
        : err.message.includes("already exists")
          ? 400
          : 500;
    res.status(status).json({ message: err.message || "Server Error" });
  }
};

/**
 * PUT /users/:userId
 * Update user (admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check self-modification
    if (req.user.userId === parseInt(userId)) {
      return res.status(403).json({
        message:
          "You cannot modify your own account via the admin update endpoint. Use /profile for self-updates.",
      });
    }

    const requester = await require("../models").User.findByPk(req.user.userId);
    const updatedUser = await userUpdateService.updateUser(
      userId,
      req.body,
      requester.roles,
    );

    res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    const status =
      err.message === "User not found"
        ? 404
        : err.message.includes("already exists")
          ? 400
          : 500;
    res.status(status).json({ message: err.message || "Server Error" });
  }
};

/**
 * DELETE /users/:userId
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    await userService.deleteUser(userId);

    // Log activity
    await activityLogService.logUserDeleted(user, req);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      message: err.message || "Server Error",
    });
  }
};

/**
 * POST /users/:userId/report
 * Report user
 */
exports.reportUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await userService.getUserById(userId);

    // TODO: Implement reporting logic (e.g., save to a reports table)
    res.status(200).json({ message: "User reported successfully" });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({ message: err.message });
  }
};

/**
 * PATCH /users/:userId/status
 * Update user status
 */
exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Check self-modification
    if (req.user.userId === parseInt(userId)) {
      return res.status(403).json({
        message: "You cannot change your own status",
      });
    }

    const result = await userStatusService.updateStatus(userId, status);

    // Log activity
    await activityLogService.logUserStatusUpdated(
      result.user,
      result.oldStatus,
      result.newStatus,
      req,
    );

    res.status(200).json({
      message: "User status updated successfully",
      user: result.user,
    });
  } catch (err) {
    const status = err.message.includes("only remaining")
      ? 400
      : err.message === "User not found"
        ? 404
        : 500;
    res.status(status).json({
      message: err.message || "Failed to update status",
    });
  }
};

/**
 * PATCH /users/:userId/status/inactive
 * Change status to inactive
 */
exports.changeStatusToInactive = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userStatusService.changeStatusToInactive(userId);

    // Log activity
    await activityLogService.logUserStatusChanged(
      result.user,
      result.oldStatus,
      "inactive",
      req,
    );

    res.status(200).json({
      message: "User status updated to inactive",
      user: result.user,
    });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      message: err.message || "Server Error",
    });
  }
};

/**
 * POST /users/:userId/role
 * Assign role to user
 */
exports.assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const result = await userRoleService.assignRole(userId, roleId);

    // Log activity
    await activityLogService.logUserRoleAssigned(
      result.user,
      result.oldValues,
      result.newValues,
      req,
    );

    res.status(200).json({
      message: `Role ${result.newValues.role} assigned successfully`,
      user: result.user,
    });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      message: err.message || "Server Error",
    });
  }
};

/**
 * POST /users/photo
 * Upload user photo
 */
exports.uploadUserPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    const result = await userPhotoService.uploadUserPhoto(
      req.user.userId,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    );

    res.status(200).json({
      message: "Photo uploaded successfully",
      photo_original: result.photo_original,
      photo_thumbnail: result.photo_thumbnail,
      user: result.user,
    });
  } catch (err) {
    const status = err.message.includes("FTP") ? 500 : 400;
    res.status(status).json({
      message: err.message || "Failed to upload photo",
    });
  }
};
