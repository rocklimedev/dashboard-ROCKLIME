const { ROLES } = require("../constants"); // Define roles like ROLES.Admin, ROLES.User

const role = {
  check: (requiredRole) => (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        console.log("Role check failed: User or role is undefined.");
        return res.status(403).json({ error: "User role is not defined." });
      }

      console.log("User role:", req.user.role, "Required role:", requiredRole);

      if (req.user.role !== requiredRole) {
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
