"use strict";

const Role = require("../models/roles");
const Permission = require("../models/permisson");
const RolePermission = require("../models/rolePermission");

module.exports = {
  getRolePermissions: async (req, res) => {
    try {
      // Step 1: Fetch all roles
      const roles = await Role.findAll();

      // Step 2: For each role, fetch associated permissions
      const rolesWithPermissions = [];

      for (const role of roles) {
        const permissions = await role.getPermissions(); // Sequelize association method, assuming a hasMany relationship

        const rolePermissions = permissions.map((permission) => {
          return {
            resource: permission.resource,
            permissionName: permission.permissionName,
          };
        });

        rolesWithPermissions.push({
          roleName: role.roleName,
          permissions: rolePermissions,
        });
      }

      // Step 3: Return the permissions in JSON format
      res.json(rolesWithPermissions);
    } catch (error) {
      console.log("Error fetching role permissions:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching permissions." });
    }
  },
};
