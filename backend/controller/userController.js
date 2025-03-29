const { Op } = require("sequelize");
const User = require("../models/users");
const Roles = require("../models/roles");

exports.createUser = async (req, res) => {
  try {
    const { username, name, email, password, mobileNumber, role } = req.body;

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

    // Fetch roleId from the Roles table
    let roleData = await Roles.findOne({ where: { roleName: role } });

    if (!roleData) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const roleId = roleData.roleId; // Assign roleId dynamically

    // Create a new user
    const newUser = await User.create({
      username,
      name,
      email,
      password, // Make sure to hash the password before storing
      mobileNumber,
      role, // Storing the role name
      roleId, // Assigning the correct role ID
    });

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
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
    const { username, name, email, mobileNumber, role } = req.body;

    // Find the user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username or email is already taken (excluding the current user)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
        userId: { [Op.ne]: userId }, // Ensure correct column name
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    // Update user details
    user.username = username || user.username;
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobileNumber = mobileNumber || user.mobileNumber;

    // Handle role updates
    if (role) {
      const roleData = await Roles.findOne({ where: { roleName: role } });
      if (!roleData) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      // Prevent multiple SuperAdmins
      if (role === "SuperAdmin") {
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

      // Ensure user.roles is always treated as a string
      let userRoles =
        typeof user.roles === "string" ? user.roles.split(",") : [];
      if (!userRoles.includes(role)) {
        userRoles.push(role);
      }
      user.roles = userRoles.join(",");
      user.roleId = roleData.roleId;
      user.status = role === "Users" ? "inactive" : "active";
    }

    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
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
