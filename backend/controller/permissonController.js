const Permission = require("../models/permisson");
const Role = require("../models/roles");
const RolePermission = require("../models/rolePermission");

/**
 * Create a new permission
 */
exports.createPermission = async (req, res) => {
  try {
    const { route, name, module } = req.body;

    // Check if the permission already exists
    const existingPermission = await Permission.findOne({
      where: { route, name },
    });
    if (existingPermission) {
      return res.status(400).json({ message: "Permission already exists." });
    }

    const permission = await Permission.create({ route, name, module });
    res
      .status(201)
      .json({ message: "Permission created successfully.", permission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating permission.", error: error.message });
  }
};

/**
 * Edit a permission
 */
exports.editPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { route, name, module } = req.body;

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    await permission.update({ route, name, module });
    res.json({ message: "Permission updated successfully.", permission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating permission.", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error deleting permission.", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error fetching permission.", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error fetching permissions.", error: error.message });
  }
};

/**
 * Assign permission to a role
 */
exports.assignPermissionToRole = async (req, res) => {
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

    let rolePermission = await RolePermission.findOne({ where: { roleId } });

    if (!rolePermission) {
      rolePermission = await RolePermission.create({
        roleId,
        permissions: [permissionId],
      });
    } else {
      let permissions = rolePermission.permissions;
      if (!permissions.includes(permissionId)) {
        permissions.push(permissionId);
        await rolePermission.update({ permissions });
      }
    }

    res.json({
      message: "Permission assigned to role successfully.",
      rolePermission,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error assigning permission.", error: error.message });
  }
};
