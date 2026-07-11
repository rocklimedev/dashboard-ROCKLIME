const { v4: uuidv4 } = require("uuid");
const { Role, Permission, RolePermission } = require("../models");

/**
 * Create a new role
 */
exports.createRole = async (roleName) => {
  const newRole = await Role.create({
    roleId: uuidv4(),
    roleName,
  });

  return newRole;
};

/**
 * Get all roles with permissions
 */
exports.getAllRoles = async () => {
  const roles = await Role.findAll({
    include: {
      model: Permission,
      as: "permissions",
      through: { attributes: [] },
    },
    order: [["roleName", "ASC"]],
  });

  return roles;
};

/**
 * Get role by ID with permissions
 */
exports.getRoleById = async (roleId) => {
  const role = await Role.findOne({
    where: { roleId },
    include: {
      model: Permission,
      as: "permissions",
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
};

/**
 * Delete a role
 */
exports.deleteRole = async (roleId) => {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new Error("Role not found");
  }

  // Check for associated users
  const { User } = require("../models");
  const associatedUsers = await User.findAll({ where: { roleId } });

  if (associatedUsers.length > 0) {
    throw new Error("Cannot delete role with associated users");
  }

  // Delete associated permissions
  await RolePermission.destroy({ where: { roleId } });

  // Delete the role
  await role.destroy();

  return {
    role,
    associatedUsersCount: 0,
    permissionsDeleted: true,
  };
};
