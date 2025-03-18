const { ROLES } = require("../config/constant"); // Import role constants

const role = {
  check: (allowedRoles) => (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        console.log("Role check failed: User or role is undefined.");
        return res.status(403).json({ error: "User role is not defined." });
      }

      console.log("User role:", req.user.role, "Allowed roles:", allowedRoles);

      // ✅ Super Admin has full access (bypass check)
      if (req.user.role === ROLES.SuperAdmin) {
        console.log("Super Admin detected, bypassing role check.");
        return next();
      }

      // Check if the user's role is in the allowedRoles array
      if (!allowedRoles.includes(req.user.role)) {
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
