const {
  Op,
  User,
  Role,
  Address,
  bcrypt,
  logActivity,
  ActivityLog,
  excludeSensitiveFields,
} = require("./user.helpers");

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
      isEmailVerified = false,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({
        message: "Missing required fields",
        fields: { username, email, password, roleId },
      });
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
    const roleData = await Role.findOne({ where: { roleId } });
    if (!roleData) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Validate addressId if provided
    if (addressId) {
      const address = await Address.findByPk(addressId);
      if (!address) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
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
      isEmailVerified: Boolean(isEmailVerified), // ← ADD THIS
    });
    // Activity Log
    logActivity({
      userId: req.user?.userId || null,
      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,
      action: "USER_CREATED",
      entityId: newUser.userId,
      entityName: newUser.name || newUser.username,
      description: `User "${newUser.username}" was created`,
      newValues: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        role: roleData.roleName,
        status: newUser.status,
      },
      metadata: {
        roleId,
        addressId,
      },
      req,
    }).catch(console.error);
    res.status(201).json({
      message: "User created successfully",
      data: await User.findByPk(newUser.userId, excludeSensitiveFields),
    });
  } catch (err) {
    res.status(500).json({
      message: `Failed to create user: ${
        err.message || "Unknown server error"
      }`,
    });
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

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Activity Log
    await logActivity({
      userId: req.user?.userId || null, // user performing action

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "USER_DELETED",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `User "${user.username}" was deleted`,

      oldValues: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.roles,
        status: user.status,
      },

      req,
    });

    await user.destroy();

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
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
      isEmailVerified,
      about,
    } = req.body;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-modification of critical fields via admin endpoint
    if (req.user.userId === parseInt(userId)) {
      return res.status(403).json({
        message:
          "You cannot modify your own account via the admin update endpoint. Use /profile for self-updates.",
      });
    }

    // === 1. Check duplicate username/email ===
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            username ? { username } : null,
            email ? { email } : null,
          ].filter(Boolean),
          userId: { [Op.ne]: userId },
        },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Username or Email already exists" });
      }
    }

    // === 2. Validate addressId ===
    if (addressId) {
      const address = await Address.findByPk(addressId);
      if (!address) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
    }

    // === 3. Handle Role Update ===
    if (roleId) {
      const roleData = await Role.findOne({ where: { roleId } });
      if (!roleData) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      user.roleId = roleData.roleId;
      user.roles = roleData.roleName;

      // Auto-set status based on role
      user.status = roleData.roleName === "Users" ? "inactive" : "active";
    }

    // === 4. Update basic fields (only if explicitly provided) ===
    if (username !== undefined) user.username = username;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber || null;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup || null;
    if (emergencyNumber !== undefined)
      user.emergencyNumber = emergencyNumber || null;
    if (shiftFrom !== undefined) user.shiftFrom = shiftFrom || null;
    if (shiftTo !== undefined) user.shiftTo = shiftTo || null;
    if (addressId !== undefined) user.addressId = addressId || null;
    if (about !== undefined) user.about = about || null;

    // === 5. Update Status ===
    if (status !== undefined) {
      const validStatuses = ["active", "inactive", "restricted"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Must be: active, inactive, or restricted",
        });
      }

      // Only prevent deactivating the *last* SuperAdmin if trying to change it
      if (
        user.roles.includes("SUPER_ADMIN") &&
        status !== "active" &&
        (await User.count({
          where: { roles: { [Op.like]: "%SUPER_ADMIN%" } },
        })) <= 1
      ) {
        return res.status(400).json({
          message: "Cannot deactivate the only remaining SuperAdmin",
        });
      }

      user.status = status;
    }

    // === 6. Update Email Verification (Admin/SuperAdmin only) ===
    if (isEmailVerified !== undefined) {
      const requester = await User.findByPk(req.user.userId);
      if (
        !requester ||
        !["ADMIN", "SUPER_ADMIN", "DEVELOPER"].includes(requester.roles)
      ) {
        return res.status(403).json({
          message:
            "Only Admin or SuperAdmin or Developer can change email verification status",
        });
      }
      user.isEmailVerified = Boolean(isEmailVerified);
    }

    // Save changes
    await user.save();

    // Return safe data
    const updatedUser = await User.findByPk(user.userId, {
      ...excludeSensitiveFields,
      include: [
        {
          model: Address,
          as: "address",
          attributes: ["street", "city", "state", "country", "postalCode"],
        },
      ],
    });

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      message: `Failed to update user: ${err.message || "Unknown server error"}`,
    });
  }
};
