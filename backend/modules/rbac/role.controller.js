const userRoleAssignmentService = require("../services/userRoleAssignmentService");
const roleService = require("../services/roleService");
const rolePermissionService = require("../services/rolePermissionService");
const roleActivityLogService = require("../services/roleActivityLogService");

// ============================================
// USER ROLE ASSIGNMENT ENDPOINTS
// ============================================

/**
 * POST /users/:userId/assign-role
 * Assign role to user
 */
exports.assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const result = await userRoleAssignmentService.assignRole(userId, role);

    // Log activity
    await roleActivityLogService.logRoleAssignedToUser(
      userId,
      result.assignedRole,
      result.oldValues,
      result.newValues,
      req,
    );

    res.status(200).json({
      success: true,
      message: `Role ${result.assignedRole} assigned successfully`,
    });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error assigning role",
    });
  }
};

/**
 * GET /users/roles/recent-to-give
 * Get users eligible for role assignment
 */
exports.getRecentRoleToGive = async (req, res) => {
  try {
    const result = await userRoleAssignmentService.getRecentRoleToGive();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching users for role assignment",
    });
  }
};

/**
 * POST /users/roles/check-status
 * Auto-set status to inactive if no roleId assigned within 7 days
 */
exports.checkUserRoleStatus = async (req, res) => {
  try {
    await userRoleAssignmentService.checkUserRoleStatus();
    res.status(200).json({
      success: true,
      message: "User role status check completed",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error checking user role status",
    });
  }
};

// ============================================
// ROLE MANAGEMENT ENDPOINTS
// ============================================

/**
 * POST /roles
 * Create a new role
 */
exports.createRole = async (req, res) => {
  try {
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const newRole = await roleService.createRole(roleName);

    // Log activity
    await roleActivityLogService.logRoleCreated(newRole, req);

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error creating role",
    });
  }
};

/**
 * GET /roles
 * Get all roles with permissions
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error retrieving roles",
    });
  }
};

/**
 * GET /roles/:roleId
 * Get role by ID with permissions
 */
exports.getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await roleService.getRoleById(roleId);
    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (err) {
    const status = err.message === "Role not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error retrieving role",
    });
  }
};

/**
 * DELETE /roles/:roleId
 * Delete a role
 */
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const result = await roleService.deleteRole(roleId);

    // Log activity
    await roleActivityLogService.logRoleDeleted(result.role, req);

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (err) {
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("associated users")
        ? 400
        : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error deleting role",
    });
  }
};

// ============================================
// ROLE PERMISSION ENDPOINTS
// ============================================

/**
 * POST /roles/:roleId/permissions
 * Assign single permission to role
 */
exports.assignPermissionToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    if (!permissionId) {
      return res.status(400).json({ message: "Permission ID is required" });
    }

    const result = await rolePermissionService.assignPermissionToRole(
      roleId,
      permissionId,
    );

    // Log activity
    await roleActivityLogService.logPermissionAssignedToRole(
      result.roleId,
      result.roleName,
      result.permissionId,
      result.permissionName,
      req,
    );

    res.status(201).json({
      success: true,
      message: "Permission assigned successfully",
      data: result.rolePermission,
    });
  } catch (err) {
    const status =
      err.message === "Role not found" || err.message === "Permission not found"
        ? 404
        : err.message.includes("already assigned")
          ? 409
          : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error assigning permission to role",
    });
  }
};

/**
 * DELETE /roles/:roleId/permissions
 * Remove permission(s) from role
 */
exports.removePermissionFromRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    const result = await rolePermissionService.removePermissionFromRole(
      roleId,
      permissionId,
    );

    // Log activity
    await roleActivityLogService.logPermissionsRemovedFromRole(
      result.roleId,
      result.roleName,
      result.removedPermissions,
      result.removedCount,
      req,
    );

    res.status(200).json({
      success: true,
      message: "Permissions removed successfully",
    });
  } catch (err) {
    const status = err.message === "Role not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error removing permissions from role",
    });
  }
};

/**
 * GET /roles/:roleId/permissions
 * Get all permissions for a role
 */
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const result = await rolePermissionService.getRolePermissions(roleId);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to fetch role permissions",
    });
  }
};

/**
 * PUT /roles/:roleId/permissions
 * Update all permissions for a role (replace entire set)
 */
exports.updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        message: "Permissions must be provided as an array",
      });
    }

    const result = await rolePermissionService.updateRolePermissions(
      roleId,
      permissions,
    );

    // Log activity
    await roleActivityLogService.logRolePermissionsUpdated(
      result.roleId,
      result.roleName,
      result.permissions,
      req,
    );

    res.status(200).json({
      success: true,
      message: "Role permissions updated successfully",
      data: result,
    });
  } catch (err) {
    const status = err.message === "Role not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error updating role permissions",
    });
  }
};

/**
 * POST /roles/:roleId/permissions/bulk
 * Bulk assign permissions to role
 */
exports.bulkAssignPermissionsToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        message: "Permission IDs must be provided as an array",
      });
    }

    const result = await rolePermissionService.bulkAssignPermissionsToRole(
      roleId,
      permissionIds,
    );

    // Log activity
    await roleActivityLogService.logRolePermissionsUpdated(
      result.roleId,
      result.roleName,
      result.assignedPermissions,
      req,
    );

    res.status(201).json({
      success: true,
      message: "Permissions assigned successfully",
      data: result,
    });
  } catch (err) {
    const status = err.message === "Role not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Error assigning permissions to role",
    });
  }
};
