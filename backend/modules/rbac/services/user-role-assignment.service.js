const { Op } = require("sequelize");
const { User, Role } = require("../models");

/**
 * Assign role to user
 */
exports.assignRole = async (userId, role) => {
  const user = await User.findOne({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found");
  }

  // Fetch roleId from Roles table
  const roleData = await Role.findOne({ where: { roleName: role } });

  if (!roleData) {
    throw new Error("Invalid role specified");
  }

  const roleId = roleData.roleId;

  // Check if a SuperAdmin already exists
  if (role === "SuperAdmin") {
    const existingSuperAdmin = await User.findOne({
      where: { roles: { [Op.substring]: "SuperAdmin" } },
    });

    if (existingSuperAdmin) {
      throw new Error("A SuperAdmin already exists");
    }
  }

  let userRoles = user.roles ? user.roles.split(",") : [];

  const oldValues = {
    roles: user.roles,
    roleId: user.roleId,
    status: user.status,
  };

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

  return {
    user,
    oldValues,
    newValues: {
      roles: user.roles,
      roleId: role === "Users" ? null : roleId,
      status: role === "Users" ? "inactive" : "active",
    },
    assignedRole: role,
  };
};

/**
 * Get users eligible for role assignment
 */
exports.getRecentRoleToGive = async () => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { roleId: { [Op.is]: null } },
        {
          createdAt: { [Op.gte]: fourteenDaysAgo },
          status: "inactive",
        },
      ],
      status: { [Op.ne]: "restricted" },
    },
    include: [{ model: Role, attributes: ["id", "name"] }],
  });

  // If no users are found or all users have roleId assigned
  if (!users.length || users.every((user) => user.roleId !== null)) {
    return {
      success: true,
      message: "No users left for role assignment",
      users: [],
    };
  }

  return {
    success: true,
    users,
  };
};

/**
 * Auto-set status to inactive if no roleId assigned within 7 days
 */
exports.checkUserRoleStatus = async () => {
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
    },
  );
};
