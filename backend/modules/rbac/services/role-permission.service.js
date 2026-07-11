const { Role, Permission, RolePermission } = require("../models");
const { Op } = require("sequelize");

/**
 * Assign single permission to role
 */
exports.assignPermissionToRole = async (roleId, permissionId) => {
  // Validate if role exists
  const roleExists = await Role.findByPk(roleId);
  if (!roleExists) {
    throw new Error("Role not found");
  }

  // Ensure permission exists
  const permissionExists = await Permission.findByPk(permissionId);
  if (!permissionExists) {
    throw new Error("Permission not found");
  }

  // Assign new permission to role
  const [rolePermission, created] = await RolePermission.findOrCreate({
    where: { roleId, permissionId },
    defaults: { roleId, permissionId },
  });

  if (!created) {
    throw new Error("Permission already assigned to role");
  }

  return {
    rolePermission,
    roleId,
    roleName: roleExists.roleName,
    permissionId,
    permissionName: permissionExists.name || null,
  };
};

/**
 * Remove single or multiple permissions from role
 */
exports.removePermissionFromRole = async (roleId, permissionIds) => {
  // Validate if role exists
  const roleExists = await Role.findByPk(roleId);
  if (!roleExists) {
    throw new Error("Role not found");
  }

  // Convert permissionId to an array if it's a single value
  const permissionsToRemove = Array.isArray(permissionIds)
    ? permissionIds
    : [permissionIds];

  // Ensure at least one permission is provided
  if (!permissionsToRemove.length) {
    throw new Error("No permissionId provided");
  }

  // Remove permissions from RolePermission table
  const deletedCount = await RolePermission.destroy({
    where: { roleId, permissionId: permissionsToRemove },
  });

  if (deletedCount === 0) {
    throw new Error("Permissions not found or already removed");
  }

  return {
    roleId,
    roleName: roleExists.roleName,
    removedPermissions: permissionsToRemove,
    removedCount: deletedCount,
  };
};

/**
 * Get all permissions for a role
 */
exports.getRolePermissions = async (roleId) => {
  if (!roleId) {
    throw new Error("Role ID is required");
  }

  const rolePermissions = await RolePermission.findAll({
    where: { roleId },
    include: [
      { model: Role, attributes: ["roleId", "roleName"] },
      {
        model: Permission,
        attributes: ["permissionId", "module", "api", "route"],
      },
    ],
  });

  if (!rolePermissions.length) {
    return {
      message: "No permissions found for this role",
      rolePermissions: [],
    };
  }

  return {
    message: "All role permissions retrieved successfully",
    rolePermissions,
  };
};

/**
 * Update all permissions for a role (replace entire set)
 */
exports.updateRolePermissions = async (roleId, permissionIds) => {
  // Validate if role exists
  const roleExists = await Role.findByPk(roleId);
  if (!roleExists) {
    throw new Error("Role not found");
  }

  // Validate permissions exist
  const validPermissions = await Permission.findAll({
    where: { permissionId: permissionIds },
  });

  if (validPermissions.length !== permissionIds.length) {
    throw new Error("Some permissions are invalid");
  }

  // Delete existing role permissions
  await RolePermission.destroy({ where: { roleId } });

  // Assign new permissions
  const newRolePermissions = permissionIds.map((permissionId) => ({
    roleId,
    permissionId,
  }));

  await RolePermission.bulkCreate(newRolePermissions);

  return {
    roleId,
    roleName: roleExists.roleName,
    permissions: permissionIds,
    permissionCount: permissionIds.length,
    replacedAllPermissions: true,
  };
};

/**
 * Bulk assign permissions to role
 */
exports.bulkAssignPermissionsToRole = async (roleId, permissionIds) => {
  const roleExists = await Role.findByPk(roleId);
  if (!roleExists) {
    throw new Error("Role not found");
  }

  // Create records for permissions that don't already exist
  const existingPermissions = await RolePermission.findAll({
    where: { roleId, permissionId: permissionIds },
  });

  const existingPermissionIds = existingPermissions.map(
    (rp) => rp.permissionId,
  );
  const newPermissionIds = permissionIds.filter(
    (id) => !existingPermissionIds.includes(id),
  );

  if (newPermissionIds.length === 0) {
    throw new Error("All permissions are already assigned to this role");
  }

  const newRolePermissions = newPermissionIds.map((permissionId) => ({
    roleId,
    permissionId,
  }));

  await RolePermission.bulkCreate(newRolePermissions);

  return {
    roleId,
    roleName: roleExists.roleName,
    assignedPermissions: newPermissionIds,
    assignedCount: newPermissionIds.length,
    alreadyAssignedCount: existingPermissionIds.length,
  };
};
