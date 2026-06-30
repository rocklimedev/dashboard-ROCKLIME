const { v4: uuidv4 } = require("uuid");
const { Permission, Role, RolePermission } = require("../models");
const assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "roleId and permissionId are required." });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

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
    res.status(500).json({
      message: "Error assigning permission to role.",
      error: error.message,
    });
  }
};

const removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "roleId and permissionId are required." });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    const rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      return res.status(404).json({
        message: "Permission not assigned to role.",
      });
    }

    await rolePermission.destroy();

    res.status(200).json({
      message: "Permission removed from role successfully.",
      rolePermission: { roleId, permissionId },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing permission from role.",
      error: error.message,
    });
  }
};

const getAllRolePermissionsByRoleId = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({ message: "roleId is required." });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    const rolePermissions = await RolePermission.findAll({
      where: { roleId },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["roleId", "roleName"],
        },
        {
          model: Permission,
          as: "permission", // Ensure this matches the model association
          attributes: ["permissionId", "module", "name", "route", "api"],
        },
      ],
      logging: console.log,
    });

    if (!rolePermissions.length) {
      return res.status(200).json({
        message: "No permissions found for this role.",
        roleId,
        rolePermissions: [],
      });
    }

    const formattedPermissions = rolePermissions.map((rp) => ({
      id: rp.id,
      roleId: rp.roleId,
      permissionId: rp.permissionId,
      role: {
        roleId: rp.Role?.roleId,
        roleName: rp.Role?.roleName,
      },
      permission: {
        permissionId: rp.permissions?.permissionId,
        module: rp.permissions?.module,
        name: rp.permissions?.name,
        route: rp.permissions?.route,
        api: rp.permissions?.api,
      },
    }));

    res.status(200).json({
      message: "Role permissions retrieved successfully.",
      roleId,
      rolePermissions: formattedPermissions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving role permissions.",
      error: error.message,
    });
  }
};

const getRolePermissionByRoleIdAndPermissionId = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;

    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "roleId and permissionId are required." });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    const rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["roleId", "roleName"],
        },
        {
          model: Permission,
          as: "permission",
          attributes: ["permissionId", "module", "name", "route", "api"],
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
        role: {
          roleId: rolePermission.Role?.roleId,
          roleName: rolePermission.Role?.roleName,
        },
        permission: {
          permissionId: rolePermission.permissions?.permissionId,
          module: rolePermission.permissions?.module,
          name: rolePermission.permissions?.name,
          route: rolePermission.permissions?.route,
          api: rolePermission.permissions?.api,
        },
      },
    });
  } catch (error) {
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
          as: "role",
          attributes: ["roleId", "roleName"],
        },
        {
          model: Permission,
          as: "permission",
          attributes: ["permissionId", "module", "name", "route", "api"],
        },
      ],
    });

    const formattedPermissions = rolePermissions.map((rp) => ({
      id: rp.id,
      roleId: rp.roleId,
      permissionId: rp.permissionId,
      role: {
        roleId: rp.Role?.roleId,
        roleName: rp.Role?.roleName,
      },
      permission: {
        permissionId: rp.permissions?.permissionId,
        module: rp.permissions?.module,
        name: rp.permissions?.name,
        route: rp.permissions?.route,
        api: rp.permissions?.api,
      },
    }));

    res.status(200).json({
      message: "All role permissions retrieved successfully.",
      rolePermissions: formattedPermissions,
    });
  } catch (error) {
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
