const { Op } = require("sequelize");
const { User } = require("../models");
const ROLES = require("../config/constant").ROLES;

const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

/**
 * Update user status
 */
exports.updateStatus = async (userId, newStatus) => {
  const validStatuses = ["active", "inactive", "restricted"];

  if (!newStatus || !validStatuses.includes(newStatus)) {
    throw new Error(
      "Invalid status. Must be one of: active, inactive, restricted",
    );
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Prevent deactivating the last SuperAdmin
  if (user.roles.includes(ROLES.SuperAdmin) && newStatus !== "active") {
    const superAdminCount = await User.count({
      where: {
        roles: {
          [Op.like]: `%${ROLES.SuperAdmin}%`,
        },
      },
    });

    if (superAdminCount <= 1) {
      throw new Error("Cannot deactivate or restrict the only SuperAdmin");
    }
  }

  const oldStatus = user.status;
  user.status = newStatus;
  await user.save();

  return {
    user: await User.findByPk(user.userId, excludeSensitiveFields),
    oldStatus,
    newStatus,
  };
};

/**
 * Change status to inactive
 */
exports.changeStatusToInactive = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const oldStatus = user.status;
  user.status = "inactive";
  await user.save();

  return {
    user: await User.findByPk(user.userId, excludeSensitiveFields),
    oldStatus,
  };
};
