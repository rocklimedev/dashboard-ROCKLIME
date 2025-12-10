const { Op } = require("sequelize");
const { User, Roles, Address } = require("../models");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");
const ROLES = require("../config/constant").ROLES;
const path = require("path");
const ftp = require("basic-ftp");
const sharp = require("sharp"); // npm i sharp
const { v4: uuidv4 } = require("uuid");
const { Readable } = require("stream");
// Helper function to exclude sensitive fields
const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

function bufferToStream(buffer) {
  return Readable.from(buffer);
}
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
    const roleData = await Roles.findOne({ where: { roleId } });
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

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      ...excludeSensitiveFields,
      include: [
        {
          model: Address,
          as: "address", // ← Must match your association alias in setupDB.js
          attributes: ["street", "city", "state", "postalCode", "country"], // optional: only return needed fields
        },
      ],
    });

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

// UPDATE PROFILE (MANAGED TRANSACTION - BEST ONE)
// ========================
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
      address,
      photo_thumbnail,
      photo_original,
    } = req.body;

    const updatedUser = await sequelize.transaction(async (t) => {
      const user = await User.findByPk(req.user.userId, { transaction: t });
      if (!user) throw new Error("User not found");

      // Check duplicate username/email
      if (username || email) {
        const exists = await User.findOne({
          where: {
            [Op.or]: [
              username ? { username } : null,
              email ? { email } : null,
            ].filter(Boolean),
            userId: { [Op.ne]: user.userId },
          },
          transaction: t,
        });
        if (exists) throw new Error("Username or Email already exists");
      }

      // Update fields
      Object.assign(user, {
        username: username ?? user.username,
        name: name ?? user.name,
        email: email ?? user.email,
        mobileNumber: mobileNumber ?? user.mobileNumber,
        dateOfBirth: dateOfBirth ?? user.dateOfBirth,
        bloodGroup: bloodGroup ?? user.bloodGroup,
        emergencyNumber: emergencyNumber ?? user.emergencyNumber,
        shiftFrom: shiftFrom ?? user.shiftFrom,
        shiftTo: shiftTo ?? user.shiftTo,
        photo_thumbnail: photo_thumbnail || user.photo_thumbnail,
        photo_original: photo_original || user.photo_original,
      });

      // Handle address
      // Handle address
      if (address) {
        if (user.addressId) {
          await Address.update(address, {
            where: { addressId: user.addressId },
            transaction: t,
          });
        } else {
          // FIX: Pass userId explicitly when creating
          const newAddr = await Address.create(
            {
              ...address,
              userId: user.userId, // ← THIS WAS MISSING!
            },
            { transaction: t }
          );
          user.addressId = newAddr.addressId;
        }
      }
      await user.save({ transaction: t });

      return await User.findByPk(user.userId, {
        ...excludeSensitiveFields,
        include: [{ model: Address, as: "address" }],
        transaction: t,
      });
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    const status =
      err.message === "User not found"
        ? 404
        : err.message.includes("already exists")
        ? 400
        : 500;
    res.status(status).json({ message: err.message || "Server Error" });
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
// Update User (Admin / SuperAdmin only)
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
      isEmailVerified, // ← NEW: Allow updating email verification status
      about,
    } = req.body;

    // Find the user to update
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-modification of critical fields (optional security)
    if (req.user.userId === userId) {
      return res.status(403).json({
        message: "You cannot modify your own account via this endpoint",
      });
    }

    // === 1. Check duplicate username/email (excluding current user) ===
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

    // === 2. Validate addressId if provided ===
    if (addressId) {
      const address = await Address.findByPk(addressId);
      if (!address) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
    }

    // === 3. Handle Role Update (with SuperAdmin protection) ===
    if (roleId) {
      const roleData = await Roles.findOne({ where: { roleId } });
      if (!roleData) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      // Prevent assigning SuperAdmin if one already exists (except current)
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

      user.roleId = roleData.roleId;
      user.roles = roleData.roleName;
      // Auto-set status based on role (optional)
      user.status = roleData.roleName === "Users" ? "inactive" : "active";
    }

    // === 4. Update Basic Fields (only if provided) ===
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

    // === 5. Update Status (active/inactive/restricted) ===
    if (status !== undefined) {
      const validStatuses = ["active", "inactive", "restricted"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Must be: active, inactive, or restricted",
        });
      }

      // Prevent deactivating/restricting the last SuperAdmin
      if (
        user.roles.includes("SUPER_ADMIN") &&
        status !== "active" &&
        (await User.count({
          where: { roles: { [Op.like]: `%SUPER_ADMIN%` } },
        })) <= 1
      ) {
        return res.status(400).json({
          message: "Cannot deactivate or restrict the only SuperAdmin",
        });
      }

      user.status = status;
    }

    // === 6. Update Email Verification Status (Admin only) ===
    if (isEmailVerified !== undefined) {
      // Optional: Restrict to Admin/SuperAdmin only
      const requester = await User.findByPk(req.user.userId);
      if (!requester || !["ADMIN", "SUPER_ADMIN"].includes(requester.roles)) {
        return res.status(403).json({
          message: "Only Admin or SuperAdmin can verify email",
        });
      }
      user.isEmailVerified = Boolean(isEmailVerified);
    }

    // === 7. Save Updated User ===
    await user.save();

    // === 8. Return Safe User Data (without password) ===
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
    console.error("Update User Error:", err);
    return res.status(500).json({
      message: `Failed to update user: ${
        err.message || "Unknown server error"
      }`,
    });
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

// Update User Status (Admin/SuperAdmin only)

// Update User Status (Admin/SuperAdmin only)
exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "restricted"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: active, inactive, restricted",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.userId === userId) {
      return res.status(403).json({
        message: "You cannot change your own status",
      });
    }

    if (user.roles.includes(ROLES.SuperAdmin) && status !== "active") {
      const superAdminCount = await User.count({
        where: { roles: { [Op.like]: `%${ROLES.SuperAdmin}%` } },
      });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate or restrict the only SuperAdmin",
        });
      }
    }

    user.status = status;
    await user.save();

    // Now safe to use excludeSensitiveFields
    const updatedUser = await User.findByPk(
      user.userId,
      excludeSensitiveFields
    );

    res.status(200).json({
      message: "User status updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      message: `Failed to update status: ${
        err.message || "Unknown server error"
      }`,
    });
  }
};
/**
 * POST /users/photo
 * Body: multipart/form-data → field "photo"
 * Auth: logged-in user (req.user.userId)
 */
exports.uploadUserPhoto = async (req, res) => {
  try {
    // 1. Validate file
    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMime.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Only JPEG, PNG or WEBP images are allowed" });
    }

    // 2. Generate unique names
    const ext = path.extname(req.file.originalname);
    const uid = uuidv4();
    const originalName = `${uid}${ext}`;
    const thumbName = `${uid}_thumb${ext}`;

    // 3. Prepare FTP client
    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === "development";

    let originalUrl, thumbUrl;
    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === "true",
      });

      const uploadDir = "/user_photos";
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir);

      // ---- Upload original ----
      const originalStream = bufferToStream(req.file.buffer);
      await client.uploadFrom(originalStream, originalName);
      originalUrl = `${process.env.FTP_BASE_URL}${uploadDir}/${originalName}`;

      // ---- Create & upload thumbnail (200×200) ----
      const thumbBuffer = await sharp(req.file.buffer)
        .resize(200, 200, { fit: "cover", withoutEnlargement: true })
        .toBuffer();

      const thumbStream = bufferToStream(thumbBuffer);
      await client.uploadFrom(thumbStream, thumbName);
      thumbUrl = `${process.env.FTP_BASE_URL}${uploadDir}/${thumbName}`;
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    // 4. Update user record
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.photo_original = originalUrl;
    user.photo_thumbnail = thumbUrl;
    await user.save();

    // 5. Return updated user (no password, timestamps…)
    const safeUser = await User.findByPk(user.userId, excludeSensitiveFields);

    return res.status(200).json({
      message: "Photo uploaded successfully",
      photo_original: originalUrl,
      photo_thumbnail: thumbUrl,
      user: safeUser,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
