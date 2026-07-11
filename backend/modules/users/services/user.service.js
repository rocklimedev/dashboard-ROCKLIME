const { Op } = require("sequelize");
const { User, Role, Address } = require("../models");
const bcrypt = require("bcrypt");

const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

/**
 * Create a new user
 */
exports.createUser = async (userData) => {
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
  } = userData;

  // Validate required fields
  if (!username || !email || !password || !roleId) {
    throw new Error(
      "Missing required fields: username, email, password, roleId",
    );
  }

  // Check for duplicate username or email
  const existingUser = await User.findOne({
    where: { [Op.or]: [{ username }, { email }] },
  });
  if (existingUser) {
    throw new Error("Username or Email already exists");
  }

  // Validate roleId
  const roleData = await Role.findOne({ where: { roleId } });
  if (!roleData) {
    throw new Error("Invalid role specified");
  }

  // Validate addressId if provided
  if (addressId) {
    const address = await Address.findByPk(addressId);
    if (!address) {
      throw new Error("Invalid address ID");
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
    isEmailVerified: Boolean(isEmailVerified),
  });

  return newUser;
};

/**
 * Get user by ID
 */
exports.getUserById = async (userId) => {
  const user = await User.findByPk(userId, excludeSensitiveFields);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

/**
 * Get user profile with address
 */
exports.getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    ...excludeSensitiveFields,
    include: [
      {
        model: Address,
        as: "address",
        attributes: ["street", "city", "state", "postalCode", "country"],
      },
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Search users by query
 */
exports.searchUsers = async (query, page = 1, limit = 20) => {
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

  return {
    users: users.rows,
    total: users.count,
    page: parseInt(page),
    totalPages: Math.ceil(users.count / limit),
  };
};

/**
 * Get all users with filters and sorting
 */
exports.getAllUsers = async (filters) => {
  const {
    page = 1,
    limit = 20,
    searchTerm = "",
    sortBy = "Recently Added",
    status = "All",
  } = filters;

  const offset = (page - 1) * limit;

  // Build where clause
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

  // Build order clause
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

  // Calculate stats
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

  return {
    users: users.rows,
    total: users.count,
    page: parseInt(page),
    totalPages: Math.ceil(users.count / limit),
    stats,
  };
};

/**
 * Delete user
 */
exports.deleteUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  await user.destroy();
  return user;
};

/**
 * Get exclude sensitive fields config
 */
exports.getExcludeSensitiveFields = () => excludeSensitiveFields;
