const role = {
  check: (allowedRoleIds) => async (req, res, next) => {
    try {
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

      // ✅ Super Admin bypass check (Make sure to use Super Admin's roleId)
      const SUPER_ADMIN_ROLE_ID = "c2eaf23a-765c-4ee5-91bf-cbc37fbdea21"; // Replace with actual Super Admin roleId
      if (req.user.roleId === SUPER_ADMIN_ROLE_ID) {
        console.log("Super Admin detected, bypassing role check.");
        return next();
      }

      // Check if user's roleId exists in allowedRoleIds array
      if (!allowedRoleIds.includes(req.user.roleId)) {
        console.log("Access forbidden: Insufficient permissions.");
        return res.status(403).json({
          error: "Access forbidden: insufficient permissions.",
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
