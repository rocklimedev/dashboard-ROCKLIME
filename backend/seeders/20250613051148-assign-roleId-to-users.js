const User = require("../models/users");
const Role = require("../models/roles");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch all users
    const users = await User.findAll({
      attributes: ["userId", "roles"],
    });

    // Fetch all roles
    const roles = await Role.findAll({
      attributes: ["roleId", "roleName"],
    });

    // Create a map of roleName to roleId
    const roleMap = roles.reduce((map, role) => {
      map[role.roleName] = role.roleId;
      return map;
    }, {});

    // Update each user's roleId
    const updates = users.map((user) => {
      const roleName = user.roles[0]; // Take the first role (e.g., "SALES")
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.warn(
          `No roleId found for roleName: ${roleName} for user ${user.userId}`
        );
        return null;
      }
      return queryInterface.bulkUpdate(
        "users",
        { roleId: roleId },
        { userId: user.userId }
      );
    });

    // Filter out null updates and execute
    await Promise.all(updates.filter((update) => update !== null));
    console.log("Successfully assigned roleIds to users.");
  },

  down: async (queryInterface, Sequelize) => {
    // Revert roleId to NULL
    await queryInterface.bulkUpdate("users", { roleId: null }, {});
    console.log("Reverted roleIds to NULL.");
  },
};
