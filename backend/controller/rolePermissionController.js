// controllers/rolePermissionController.js
const { v4: uuidv4 } = require("uuid");
const Role = require("../models/roles");
const Permission = require("../models/permisson");
const RolePermission = require("../models/rolePermission");
const assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    // Validate inputs
    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "roleId and permissionId are required." });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    // Check if permission exists
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    // Check if permission is already assigned
    const existingRolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
    });

    if (existingRolePermission) {
      return res.status(200).json({
        message: "Permission already assigned to role.",
        rolePermission: {
          id: existingRolePermission.id,
          roleId,
          permissionId,
        },
      });
    }

    // Create new RolePermission entry
    const rolePermission = await RolePermission.create({
      id: uuidv4(),
      roleId,
      permissionId,
    });

    res.status(201).json({
      message: "Permission assigned to role successfully.",
      rolePermission: {
        id: rolePermission.id,
        roleId,
        permissionId,
      },
    });
  } catch (error) {
    console.error("Error assigning permission to role:", error);
    res.status(500).json({
      message: "Error assigning permission to role.",
      error: error.message,
    });
  }
};

const removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    // Validate inputs
    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "roleId and permissionId are required." });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    // Check if permission exists
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    // Find the RolePermission entry
    const rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      return res.status(404).json({
        message: "Permission not assigned to role.",
      });
    }

    // Delete the RolePermission entry
    await rolePermission.destroy();

    res.status(200).json({
      message: "Permission removed from role successfully.",
      rolePermission: { roleId, permissionId },
    });
  } catch (error) {
    console.error("Error removing permission from role:", error);
    res.status(500).json({
      message: "Error removing permission from role.",
      error: error.message,
    });
  }
};

const getAllRolePermissionsByRoleId = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Validate input
    if (!roleId) {
      return res.status(400).json({ message: "roleId is required." });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    // Get all RolePermission entries for the role
    const rolePermissions = await RolePermission.findAll({
      where: { roleId },
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["permissionId", "module", "name", "route"],
        },
      ],
      logging: console.log, // Logs the SQL query
    });

    // Format response
    const permissions = rolePermissions.map((rp) => ({
      id: rp.id,
      roleId: rp.roleId,
      permissionId: rp.permissionId,
      permission: {
        module: rp.permission?.module,
        name: rp.permission?.name,
        route: rp.permission?.route,
      },
    }));

    res.status(200).json({
      message: "Role permissions retrieved successfully.",
      roleId,
      permissions,
    });
  } catch (error) {
    console.error("Error retrieving role permissions:", error);
    res.status(500).json({
      message: "Error retrieving role permissions.",
      error: error.message,
    });
  }
};

const getRolePermissionByRoleIdAndPermissionId = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;

    // Validate inputs
    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "roleId and permissionId are required." });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    // Check if permission exists
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    // Find the RolePermission entry
    const rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["permissionId", "module", "name", "route"],
        },
      ],
    });

    if (!rolePermission) {
      return res.status(404).json({
        message: "Permission not assigned to role.",
      });
    }

    res.status(200).json({
      message: "Role permission retrieved successfully.",
      rolePermission: {
        id: rolePermission.id,
        roleId: rolePermission.roleId,
        permissionId: rolePermission.permissionId,
        permission: {
          module: rolePermission.Permission?.module,
          name: rolePermission.Permission?.name,
          route: rolePermission.Permission?.route,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving role permission:", error);
    res.status(500).json({
      message: "Error retrieving role permission.",
      error: error.message,
    });
  }
};

const getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermission.findAll({
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["roleId", "roleName"],
        },
        {
          model: Permission,
          as: "permissions",
          attributes: ["permissionId", "module", "name", "route"],
        },
      ],
    });

    const formattedPermissions = rolePermissions.map((rp) => ({
      id: rp.id,
      roleId: rp.roleId,
      permissionId: rp.permissionId,
      role: {
        roleName: rp.role?.roleName,
      },
      permission: {
        module: rp.permission?.module,
        name: rp.permission?.name,
        route: rp.permission?.route,
      },
    }));

    res.status(200).json({
      message: "All role permissions retrieved successfully.",
      rolePermissions: formattedPermissions,
    });
  } catch (error) {
    console.error("Error retrieving all role permissions:", error);
    res.status(500).json({
      message: "Error retrieving all role permissions.",
      error: error.message,
    });
  }
};

module.exports = {
  assignPermissionToRole,
  removePermissionFromRole,
  getAllRolePermissionsByRoleId,
  getRolePermissionByRoleIdAndPermissionId,
  getAllRolePermissions,
};
