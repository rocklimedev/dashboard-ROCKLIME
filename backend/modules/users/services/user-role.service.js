const { User, Role } = require("../models");

const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

/**
 * Assign or update user role
 */
exports.assignRole = async (userId, roleId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const roleData = await Role.findOne({ where: { roleId } });
  if (!roleData) {
    throw new Error("Invalid role specified");
  }

  const oldRole = user.roles;
  const oldRoleId = user.roleId;
  const oldStatus = user.status;

  user.roles = roleData.roleName;
  user.roleId = roleData.roleId;
  user.status = roleData.roleName === "Users" ? "inactive" : "active";

  await user.save();

  return {
    user: await User.findByPk(user.userId, excludeSensitiveFields),
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
  };
};
