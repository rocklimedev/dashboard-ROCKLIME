const {
  uuidv4,
  Op,
  User,
  Permission,
  Role,
  RolePermission,
  logActivity,
} = require("./role.helpers");

// Create a new role
const createRole = async (req, res) => {
  const { roleName } = req.body;

  try {
    // Create a new role and associate permissions
    const newRole = await Role.create({
      roleId: uuidv4(),
      roleName,
      // This will be an array of permission IDs
    });
    await logActivity({
      userId: req.user?.userId,
      contextTag: "SYSTEM",
      subContext: "ROLE",
      action: "CREATE_ROLE",
      entityId: newRole.roleId,
      entityName: newRole.roleName,
      description: `Role "${newRole.roleName}" created`,

      metadata: {
        roleId: newRole.roleId,
        roleName: newRole.roleName,
        createdVia: "ADMIN_PANEL",
      },

      req,
    });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: "Error creating role" });
  }
};

// Get all roles with permissions
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: {
        model: Permission,
        as: "permissions", // ← Match the alias exactly
        through: { attributes: [] }, // Optional: hide junction table attributes
      },
      // Optional: order for consistency
      order: [["roleName", "ASC"]],
    });

    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving roles" });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  const { roleId } = req.params;

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Check for associated users
    const associatedUsers = await User.findAll({ where: { roleId } });
    if (associatedUsers.length > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete role with associated users" });
    }

    // Delete associated permissions
    await RolePermission.destroy({ where: { roleId } });

    // Delete the role
    await role.destroy(); // or Role.destroy({ where: { roleId } })
    await logActivity({
      userId: req.user?.userId,
      contextTag: "SYSTEM",
      subContext: "ROLE",
      action: "DELETE_ROLE",
      entityId: role.roleId,
      entityName: role.roleName,
      description: `Role "${role.roleName}" deleted`,

      oldValues: {
        roleId: role.roleId,
        roleName: role.roleName,
      },

      metadata: {
        roleId: role.roleId,
        roleName: role.roleName,

        blockedDeletion: false,
        associatedUsersCount: 0, // already validated
        permissionsDeleted: true,

        severity: "critical",
        actionType: "HARD_DELETE",
      },

      req,
    });
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting role: ${error.message}` });
  }
};

const getRoleById = async (req, res) => {
  const { roleId } = req.params;

  try {
    const role = await Role.findOne({
      where: { roleId },
      include: {
        model: Permission,
        as: "permissions",
      },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving role" });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  deleteRole,
  getRoleById,
};
