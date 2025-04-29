const { Op } = require("sequelize");
const User = require("../models/users");
const Roles = require("../models/roles");
const bcrypt = require("bcrypt");
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      password,
      mobileNumber,
      roleId: roleId,
    } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    // Fetch role data using roleId
    const roleData = await Roles.findOne({ where: { roleId } });

    if (!roleData) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const roleName = roleData.roleName;

    // Hash the password before saving (best practice)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await User.create({
      username,
      name,
      email,
      password: hashedPassword, // Store hashed password
      mobileNumber,
      roles: roleName, // Store role name
      roleId, // Store role ID
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        roles: newUser.role,
        roleId: newUser.roleId,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Search User
exports.searchUser = async (req, res) => {
  try {
    const { query } = req.query;

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ],
      },
    });

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, name, email, mobileNumber } = req.body;

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.username = username || user.username;
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobileNumber = mobileNumber || user.mobileNumber;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Report User
exports.reportUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle reporting logic (simplified for now)
    // e.g., store the reason in a reports table or send email notification

    res.status(200).json({ message: "User reported successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.assignRole = async (userId, role) => {
  try {
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Fetch roleId from Roles table
    const roleData = await Roles.findOne({ where: { roleName: role } });

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

    // Assigning roles
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
      user.roleId = roleId; // Now dynamically assigned from Roles table
      user.status = "active";
    }

    await user.save();
    return { success: true, message: `Role ${role} assigned successfully` };
  } catch (error) {
    console.error("Error assigning role:", error);
    return { success: false, message: "Internal server error" };
  }
};

// Update User

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, name, email, mobileNumber, role, roleId } = req.body;

    // Find the user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username or email is already taken (excluding the current user)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
        userId: { [Op.ne]: userId },
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    // Update basic details
    user.username = username || user.username;
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobileNumber = mobileNumber || user.mobileNumber;

    // Handle role updates if either role or roleId is provided
    if (role || roleId) {
      let roleData;

      if (roleId) {
        roleData = await Roles.findOne({ where: { roleId } });
      } else {
        roleData = await Roles.findOne({ where: { roleName: role } });
      }

      if (!roleData) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      const roleNameToAssign = roleData.roleName;

      // Prevent multiple SuperAdmins
      if (roleNameToAssign === "SuperAdmin") {
        const existingSuperAdmin = await User.findOne({
          where: {
            roles: { [Op.substring]: "SuperAdmin" },
            userId: { [Op.ne]: userId },
          },
        });

        if (existingSuperAdmin) {
          return res
            .status(400)
            .json({ message: "A SuperAdmin already exists" });
        }
      }

      // Convert roles string to array and ensure role isn't duplicated
      let userRoles =
        typeof user.roles === "string" ? user.roles.split(",") : [];
      if (!userRoles.includes(roleNameToAssign)) {
        userRoles.push(roleNameToAssign);
      }

      // Set updated roles and roleId
      user.roles = userRoles.join(",");
      user.roleId = roleData.roleId;
      user.status = roleNameToAssign === "Users" ? "inactive" : "active";
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        roles: user.roles,
        roleId: user.roleId,
        status: user.status,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.changeStatusToInactive = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update status to inactive
    await user.update({ status: "inactive" });

    res.json({ message: "User status updated to inactive", user });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
