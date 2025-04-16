const { v4: uuidv4 } = require("uuid");
const Permission = require("../models/permisson");
const Role = require("../models/roles");
const RolePermission = require("../models/rolePermission");

/**
 * Create a new permission
 */
exports.createPermission = async (req, res) => {
  try {
    const { api, name, module, route } = req.body;

    if (!api || !name || !module || !route) {
      return res
        .status(400)
        .json({
          message: "All fields (api, name, module, route) are required.",
        });
    }

    const existingPermission = await Permission.findOne({
      where: { api, route, module },
    });
    if (existingPermission) {
      return res
        .status(400)
        .json({
          message: "Permission already exists for this module and route.",
        });
    }

    const permission = await Permission.create({ api, name, module, route });
    res.status(201).json({
      message: "Permission created successfully.",
      permission,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating permission.",
      error: error.message,
    });
  }
};

/**
 * Edit a permission
 */
exports.editPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { api, name, module, route } = req.body;

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    await permission.update({ api, name, module, route });
    res.json({ message: "Permission updated successfully.", permission });
  } catch (error) {
    res.status(500).json({
      message: "Error updating permission.",
      error: error.message,
    });
  }
};

/**
 * Delete a permission
 */
exports.deletePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    await permission.destroy();
    res.json({ message: "Permission deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting permission.",
      error: error.message,
    });
  }
};

/**
 * View a specific permission
 */
exports.getPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    res.json({ permission });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching permission.",
      error: error.message,
    });
  }
};

/**
 * View all permissions
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching permissions.",
      error: error.message,
    });
  }
};

/**
 * Assign permission to a role
 */
exports.assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId, isGranted = true } = req.body;

    const role = await Role.findByPk(roleId);
    const permission = await Permission.findByPk(permissionId);

    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    let rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      rolePermission = await RolePermission.create({
        id: uuidv4(),
        roleId,
        permissionId,
        isGranted,
      });
    } else {
      await rolePermission.update({ isGranted });
    }

    res.json({
      message: `Permission ${isGranted ? "granted" : "revoked"} successfully.`,
      rolePermission: {
        roleId,
        permissionId,
        isGranted,
      },
    });
  } catch (error) {
    console.error("Error assigning permission:", error);
    res.status(500).json({
      message: "Error assigning permission.",
      error: error.message,
    });
  }
};

/**
 * Remove permission from a role
 */
exports.removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    const role = await Role.findByPk(roleId);
    const permission = await Permission.findByPk(permissionId);

    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    const rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      return res
        .status(404)
        .json({ message: "Permission not assigned to role." });
    }

    await rolePermission.destroy();

    res.json({
      message: "Permission removed successfully.",
      rolePermission: { roleId, permissionId },
    });
  } catch (error) {
    console.error("Error removing permission:", error);
    res.status(500).json({
      message: "Error removing permission.",
      error: error.message,
    });
  }
};
