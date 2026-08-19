const {
  Op,
  User,
  Role,
  ROLES,
  logActivity,
  ActivityLog,
  excludeSensitiveFields,
} = require("./user.helpers");

// Report User
exports.reportUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // TODO: Implement reporting logic (e.g., save to a reports table)
    res.status(200).json({ message: "User reported successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Change Status to Inactive
exports.changeStatusToInactive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const oldStatus = user.status;

    user.status = status === false ? "inactive" : user.status;

    await user.save();

    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "USER_STATUS_CHANGED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `User "${user.username}" status changed from ${oldStatus} to ${user.status}`,

      oldValues: {
        status: oldStatus,
      },

      newValues: {
        status: user.status,
      },

      metadata: {
        changedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);

    res.status(200).json({
      message: "User status updated to inactive",
      user: await User.findByPk(user.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

// Assign Role
exports.assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const roleData = await Role.findOne({
      where: { roleId },
    });

    if (!roleData) {
      return res.status(400).json({
        message: "Invalid role specified",
      });
    }

    const oldRole = user.roles;
    const oldRoleId = user.roleId;
    const oldStatus = user.status;

    user.roles = roleData.roleName;
    user.roleId = roleData.roleId;
    user.status = roleData.roleName === "Users" ? "inactive" : "active";

    await user.save();

    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "USER_ROLE_ASSIGNED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `Role changed for user "${user.username}" from "${oldRole}" to "${roleData.roleName}"`,

      oldValues: {
        roleId: oldRoleId,
        role: oldRole,
        status: oldStatus,
      },

      newValues: {
        roleId: roleData.roleId,
        role: roleData.roleName,
        status: user.status,
      },

      metadata: {
        assignedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);

    res.status(200).json({
      message: `Role ${roleData.roleName} assigned successfully`,
      user: await User.findByPk(user.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

// Update User Status (Admin/SuperAdmin only)
exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "restricted"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: active, inactive, restricted",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (req.user.userId === userId) {
      return res.status(403).json({
        message: "You cannot change your own status",
      });
    }

    if (user.roles.includes(ROLES.SuperAdmin) && status !== "active") {
      const superAdminCount = await User.count({
        where: {
          roles: {
            [Op.like]: `%${ROLES.SuperAdmin}%`,
          },
        },
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate or restrict the only SuperAdmin",
        });
      }
    }

    const oldStatus = user.status;

    user.status = status;

    await user.save();

    // Activity Log
    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "USER_STATUS_UPDATED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `Status changed for user "${user.username}" from "${oldStatus}" to "${status}"`,

      oldValues: {
        status: oldStatus,
      },

      newValues: {
        status,
      },

      metadata: {
        changedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);

    const updatedUser = await User.findByPk(
      user.userId,
      excludeSensitiveFields,
    );

    res.status(200).json({
      message: "User status updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      message: `Failed to update status: ${
        err.message || "Unknown server error"
      }`,
    });
  }
};
