const { v4: uuidv4 } = require("uuid");
const { ROLES } = require("../config/constant");
const { Op } = require("sequelize");
const { User, Permission, Role, RolePermission } = require("../models");
const assignRole = async (userId, role) => {
  try {
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      ``;
      return { success: false, message: "User not found" };
    }

    // Fetch roleId from Roles table
    const roleData = await Role.findOne({ where: { roleName: role } });

    if (!roleData) {
      return { success: false, message: "Invalid role specified" };
    }

    const roleId = roleData.roleId; // Assign roleId dynamically

    // Check if a SuperAdmin already exists
    if (role === "SuperAdmin") {
      const existingSuperAdmin = await User.findOne({
        where: { roles: { [Op.substring]: "SuperAdmin" } }, // Improved check
      });

      if (existingSuperAdmin) {
        return { success: false, message: "A SuperAdmin already exists" };
      }
    }

    let userRoles = user.roles ? user.roles.split(",") : [];

    if (role === "Users") {
      user.roles = "Users";
      user.roleId = null;
      user.status = "inactive";
    } else {
      if (!userRoles.includes(role)) {
        userRoles.push(role);
      }
      user.roles = userRoles.join(",");
      user.roleId = roleId;
      user.status = "active";
    }
    await user.save();
    return { success: true, message: `Role ${role} assigned successfully` };
  } catch (error) {
    return { success: false, message: "Internal server error" };
  }
};
const getRecentRoleToGive = async () => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { roleId: { [Op.is]: null } }, // Ensure roleId is explicitly checked for null
          {
            createdAt: { [Op.gte]: fourteenDaysAgo },
            status: "inactive",
          },
        ],
        status: { [Op.ne]: "restricted" },
      },
      include: [{ model: Role, attributes: ["id", "name"] }], // Include role details
    });

    // If no users are found or all users have roleId assigned
    if (!users.length || users.every((user) => user.roleId !== null)) {
      return { success: true, message: "No users left for role assignment" };
    }

    return { success: true, users };
  } catch (error) {
    return { success: false, message: "Internal server error" };
  }
};

// Auto-set status to inactive if no roleId assigned within 7 days
const checkUserRoleStatus = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await User.update(
      { status: "inactive" },
      {
        where: {
          roleId: null,
          createdAt: { [Op.lte]: sevenDaysAgo },
          status: { [Op.ne]: "inactive" },
        },
      }
    );
  } catch (error) {
    console.error("Error in checkUserRoleStatus:", error);
  }
};

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
    console.error("Error retrieving roles:", error); // ← Add logging in dev
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
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting role: ${error.message}` });
  }
};

// Assign permission to a role (dynamically)
const assignPermissionsToRole = async (req, res) => {
  const { roleId } = req.params;
  const { permissionId } = req.body; // Single permissionId or array of permissionIds

  try {
    // Validate if role exists
    const roleExists = await Role.findByPk(roleId);
    if (!roleExists) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Ensure permission exists (optional but recommended)
    const permissionExists = await Permission.findByPk(permissionId);
    if (!permissionExists) {
      return res.status(404).json({ message: "Permission not found" });
    }

    // Assign new permission to role (INSERT INTO `rolepermissions`)
    const [rolePermission, created] = await RolePermission.findOrCreate({
      where: { roleId, permissionId },
      defaults: { roleId, permissionId },
    });

    if (!created) {
      return res
        .status(409)
        .json({ message: "Permission already assigned to role" });
    }

    res
      .status(201)
      .json({ message: "Permission assigned successfully", rolePermission });
  } catch (error) {
    res.status(500).json({ message: "Error assigning permission to role" });
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
    console.log("Error retrieving role:", error);
    res.status(500).json({ message: "Error retrieving role" });
  }
};
const removePermissionFromRole = async (req, res) => {
  const { roleId } = req.params;
  const { permissionId } = req.body; // Accepts a single ID or an array

  try {
    // Validate if role exists
    const roleExists = await Role.findByPk(roleId);
    if (!roleExists) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Convert permissionId to an array if it's a single value
    const permissionsToRemove = Array.isArray(permissionId)
      ? permissionId
      : [permissionId];

    // Ensure at least one permission is provided
    if (!permissionsToRemove.length) {
      return res.status(400).json({ message: "No permissionId provided" });
    }

    // Remove permissions from RolePermission table
    const deletedCount = await RolePermission.destroy({
      where: { roleId, permissionId: permissionsToRemove },
    });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Permissions not found or already removed" });
    }

    res.status(200).json({ message: "Permissions removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error removing permissions from role" });
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    if (!roleId) {
      return res.status(400).json({ message: "Role ID is required" });
    }

    const rolePermissions = await RolePermission.findAll({
      where: { roleId },
      include: [
        { model: Roles, attributes: ["roleId", "roleName"] },
        {
          model: Permission,
          attributes: ["permissionId", "module", "api", "route"],
        },
      ],
    });

    if (!rolePermissions.length) {
      return res.status(200).json({
        message: "No permissions found for this role",
        rolePermissions: [],
      });
    }

    res.status(200).json({
      message: "All role permissions retrieved successfully.",
      rolePermissions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch role permissions", error });
  }
};
const updateRolePermissions = async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body; // Expect an array of permission IDs

  try {
    // Validate if role exists
    const roleExists = await Role.findByPk(roleId);
    if (!roleExists) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Validate permissions exist
    const validPermissions = await Permission.findAll({
      where: { id: permissions },
    });

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({ message: "Some permissions are invalid." });
    }

    // Delete existing role permissions
    await RolePermission.destroy({ where: { roleId } });

    // Assign new permissions
    const newRolePermissions = permissions.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    await RolePermission.bulkCreate(newRolePermissions);

    res.status(200).json({
      message: "Role permissions updated successfully",
      roleId,
      permissions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating role permissions" });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  updateRolePermissions,
  deleteRole,
  assignPermissionsToRole,
  assignRole,
  checkUserRoleStatus,
  getRoleById,
  removePermissionFromRole,
  getRolePermissions,
  updateRolePermissions,
  getRecentRoleToGive,
};
