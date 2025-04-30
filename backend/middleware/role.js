const Role = require("../models/roles");

const role = {
  check: (allowedRoleIds) => async (req, res, next) => {
    try {
      // Validate user and roleId
      if (!req.user || !req.user.roleId) {
        console.log("Role check failed: User or roleId is undefined.");
        return res.status(403).json({ error: "User role is not defined." });
      }

      console.log(
        "User roleId:",
        req.user.roleId,
        "Allowed roleIds:",
        allowedRoleIds
      );

      // Check for Super Admin role
      const superAdminRole = await Role.findOne({
        where: { roleName: "SUPER_ADMIN" },
      });

      if (!superAdminRole) {
        console.error("Super Admin role not found in database.");
        return res
          .status(500)
          .json({ error: "Super Admin role configuration error." });
      }

      if (req.user.roleId === superAdminRole.roleId) {
        console.log("Super Admin detected, bypassing role check.");
        return next();
      }

      // Check if user's roleId exists in allowedRoleIds array
      if (!allowedRoleIds.includes(req.user.roleId)) {
        console.log("Access forbidden: Insufficient permissions.");
        return res.status(403).json({
          error: "Access forbidden: Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      console.error("Error in role middleware:", error);
      res
        .status(500)
        .json({ error: "An internal error occurred in role verification." });
    }
  },
};

module.exports = role;
