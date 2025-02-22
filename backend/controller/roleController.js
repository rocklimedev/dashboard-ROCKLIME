const RolePermission = require("../models/rolePermission");
const Permission = require("../models/permisson"); // Import models
const { v4: uuidv4 } = require("uuid");
const User = require("../models/users"); // Assuming you have a User model
const { ROLES } = require("../config/constant");

// Assign a role to a user
const assignRole = async (userId, role, roleId = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Ensure only one SUPER_ADMIN exists
    if (role === ROLES.SuperAdmin) {
      const existingSuperAdmin = await User.findOne({ roles: ROLES.SuperAdmin });
      if (existingSuperAdmin) {
        return { success: false, message: "A SuperAdmin already exists" };
      }
    }

    // Assigning roles
    if (role === ROLES.Users) {
      user.roles = ROLES.Users; // Default role
      user.roleId = null; // No roleId assigned
      user.status = "inactive"; // Default status until role assignment
    } else {
      // Roles like Admin, Accounts, Developer should be an array
      if (!Array.isArray(user.roles)) {
        user.roles = [];
      }
      
      if (!user.roles.includes(role)) {
        user.roles.push(role);
      }

      // Assign roleId only if it's provided
      if (roleId) {
        user.roleId = new mongoose.Types.ObjectId(roleId);
      }

      user.status = "active"; // Active when assigned a specific role
    }

    await user.save();
    return { success: true, message: `Role ${role} assigned successfully` };

  } catch (error) {
    console.error("Error assigning role:", error);
    return { success: false, message: "Internal server error" };
  }
};

// Auto-set status to inactive if no roleId assigned within 7 days
const checkUserRoleStatus = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersToUpdate = await User.find({
      roleId: null,
      createdAt: { $lte: sevenDaysAgo },
      status: { $ne: "inactive" },
    });

    if (usersToUpdate.length > 0) {
      await User.updateMany(
        { _id: { $in: usersToUpdate.map(user => user._id) } },
        { $set: { status: "inactive" } }
      );
    }

    console.log("Checked and updated user statuses.");
  } catch (error) {
    console.error("Error updating user statuses:", error);
  }
};


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
  assignPermissionsToRole, assignRole, checkUserRoleStatus
};
