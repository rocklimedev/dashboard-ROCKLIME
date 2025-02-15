const RolePermission = require("../models/rolePermission");
const Permission = require("../models/permisson"); // Import models
const { v4: uuidv4 } = require("uuid");

// Create a new role
const createRole = async (req, res) => {
  const { role_name, permissions } = req.body;

  try {
    // Create a new role and associate permissions
    const newRole = await RolePermission.create({
      roleId: uuidv4(),
      role_name,
      permissions, // This will be an array of permission IDs
    });

    res.status(201).json(newRole);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating role" });
  }
};

// Get all roles with permissions
const getAllRoles = async (req, res) => {
  try {
    const roles = await RolePermission.findAll({
      include: {
        model: Permission,
        as: "permissions",
      },
    });

    res.status(200).json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving roles" });
  }
};

// Update a role's permissions
const updateRolePermissions = async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body; // Array of permission IDs

  try {
    const role = await RolePermission.findByPk(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Update the permissions associated with the role
    role.permissions = permissions;
    await role.save();

    res.status(200).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating role permissions" });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  const { roleId } = req.params;

  try {
    const role = await RolePermission.findByPk(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    await role.destroy();
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting role" });
  }
};

// Assign permission to a role (dynamically)
const assignPermissionsToRole = async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body; // Array of permission IDs

  try {
    const role = await RolePermission.findByPk(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Assign new permissions to the role
    role.permissions = permissions;
    await role.save();

    res.status(200).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error assigning permissions to role" });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  updateRolePermissions,
  deleteRole,
  assignPermissionsToRole,
};
