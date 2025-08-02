const { Op } = require("sequelize");
const User = require("../models/users");
const Roles = require("../models/roles");
const bcrypt = require("bcrypt");

// Helper function to exclude sensitive fields
const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

// Middleware to check if user is authorized (e.g., Admin or SuperAdmin)
const isAdminOrSuperAdmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.userId, excludeSensitiveFields);
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.roles)) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin access required" });
  }
  next();
};

// Create User
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      password,
      mobileNumber,
      roleId,
      dateOfBirth,
      bloodGroup,
      emergencyNumber,
      shiftFrom,
      shiftTo,
      addressId,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for duplicate username or email
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    // Validate roleId
    const roleData = await Roles.findOne({ where: { roleId } });
    if (!roleData) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      dateOfBirth,
      bloodGroup,
      emergencyNumber,
      shiftFrom,
      shiftTo,
      addressId,
      roleId,
      roles: roleData.roleName,
      status: roleData.roleName === "Users" ? "inactive" : "active",
    });

    res.status(201).json({
      message: "User created successfully",
      user: await User.findByPk(newUser.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, excludeSensitiveFields);
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
    const { query, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { mobileNumber: { [Op.like]: `%${query}%` } },
        ],
      },
      ...excludeSensitiveFields,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      mobileNumber,
      dateOfBirth,
      bloodGroup,
      emergencyNumber,
      shiftFrom,
      shiftTo,
      addressId,
    } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for duplicate username or email
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
        userId: { [Op.ne]: user.userId },
      },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    // Update fields
    user.username = username || user.username;
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobileNumber = mobileNumber || user.mobileNumber;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.bloodGroup = bloodGroup || user.bloodGroup;
    user.emergencyNumber = emergencyNumber || user.emergencyNumber;
    user.shiftFrom = shiftFrom || user.shiftFrom;
    user.shiftTo = shiftTo || user.shiftTo;
    user.addressId = addressId || user.addressId;

    await user.save();
    res.status(200).json({
      message: "Profile updated successfully",
      user: await User.findByPk(user.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Report User
exports.reportUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // TODO: Implement reporting logic (e.g., save to a reports table)
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
    const {
      page = 1,
      limit = 20,
      searchTerm = "",
      sortBy = "Recently Added",
      status = "All",
    } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const where = {};
    if (searchTerm) {
      where[Op.or] = [
        { username: { [Op.like]: `%${searchTerm}%` } },
        { name: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { mobileNumber: { [Op.like]: `%${searchTerm}%` } },
      ];
    }
    if (status !== "All") {
      where.status = status === "Active" ? "active" : "inactive";
    }

    // Build order clause for sorting
    let order = [];
    switch (sortBy) {
      case "Ascending":
        order = [["name", "ASC"]];
        break;
      case "Descending":
        order = [["name", "DESC"]];
        break;
      case "Recently Added":
        order = [["createdAt", "DESC"]];
        break;
      default:
        order = [["createdAt", "DESC"]];
    }

    const users = await User.findAndCountAll({
      where,
      ...excludeSensitiveFields,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
    });

    // Calculate stats for counts
    const stats = {
      total: users.count,
      active: await User.count({ where: { status: "active" } }),
      inactive: await User.count({ where: { status: "inactive" } }),
      newJoiners: await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
    };

    res.status(200).json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit),
      stats,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, excludeSensitiveFields);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      username,
      name,
      email,
      mobileNumber,
      roleId,
      dateOfBirth,
      bloodGroup,
      emergencyNumber,
      shiftFrom,
      shiftTo,
      addressId,
      status,
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for duplicate username or email
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

    // Update basic fields
    user.username = username || user.username;
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobileNumber = mobileNumber || user.mobileNumber;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.bloodGroup = bloodGroup || user.bloodGroup;
    user.emergencyNumber = emergencyNumber || user.emergencyNumber;
    user.shiftFrom = shiftFrom || user.shiftFrom;
    user.shiftTo = shiftTo || user.shiftTo;
    user.addressId = addressId || user.addressId;
    user.status =
      status !== undefined ? (status ? "active" : "inactive") : user.status;

    // Handle role update
    if (roleId) {
      const roleData = await Roles.findOne({ where: { roleId } });
      if (!roleData) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      // Check for existing SuperAdmin
      if (roleData.roleName === "SUPER_ADMIN") {
        const existingSuperAdmin = await User.findOne({
          where: {
            roles: { [Op.like]: `%SUPER_ADMIN%` },
            userId: { [Op.ne]: userId },
          },
        });
        if (existingSuperAdmin) {
          return res
            .status(400)
            .json({ message: "A SuperAdmin already exists" });
        }
      }

      user.roles = roleData.roleName;
      user.roleId = roleData.roleId;
    }

    await user.save();
    res.status(200).json({
      message: "User updated successfully",
      user: await User.findByPk(user.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Change Status to Inactive
exports.changeStatusToInactive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // Expect status: false for inactive
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status === false ? "inactive" : user.status;
    await user.save();
    res.status(200).json({
      message: "User status updated to inactive",
      user: await User.findByPk(user.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Assign Role
exports.assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roleData = await Roles.findOne({ where: { roleId } });
    if (!roleData) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Check for existing SuperAdmin
    if (roleData.roleName === "SUPER_ADMIN") {
      const existingSuperAdmin = await User.findOne({
        where: {
          roles: { [Op.like]: `%SUPER_ADMIN%` },
          userId: { [Op.ne]: userId },
        },
      });
      if (existingSuperAdmin) {
        return res.status(400).json({ message: "A SuperAdmin already exists" });
      }
    }

    user.roles = roleData.roleName;
    user.roleId = roleData.roleId;
    user.status = roleData.roleName === "Users" ? "inactive" : "active";

    await user.save();
    res.status(200).json({
      message: `Role ${roleData.roleName} assigned successfully`,
      user: await User.findByPk(user.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
