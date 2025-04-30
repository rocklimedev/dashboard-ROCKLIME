const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Permission = require("../models/permisson"); // Fixed typo
const Role = require("../models/roles");

const checkPermission = (
  requiredApi,
  requiredName,
  requiredModule,
  requiredRoute
) => {
  return async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No token provided" });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.id) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      // Find user with associated roles
      const user = await User.findByPk(decoded.id, {
        include: [
          {
            model: Role,
            as: "roles",
            through: { attributes: [] }, // Exclude junction table attributes
          },
        ],
      });
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check for Super Admin role
      const userRoles = user.roles || [];
      if (
        userRoles.some((role) => role.roleName.toUpperCase() === "SUPER_ADMIN")
      ) {
        console.log("Super Admin detected, bypassing permission check.");
        return next();
      }

      // Validate permission parameters
      if (!requiredApi || !requiredName || !requiredModule || !requiredRoute) {
        console.error("Invalid permission parameters:", {
          requiredApi,
          requiredName,
          requiredModule,
          requiredRoute,
        });
        return res
          .status(500)
          .json({ message: "Invalid permission configuration" });
      }

      // Check permissions for non-Super Admin users
      const rolesWithPermission = await Role.findAll({
        where: {
          roleId: userRoles.map((role) => role.roleId),
        },
        include: [
          {
            model: Permission,
            through: { model: require("../models/rolePermission") }, // Use rolePermissions junction table
            where: {
              api: requiredApi,
              name: requiredName,
              module: requiredModule,
              route: requiredRoute,
            },
          },
        ],
      });

      // Check if any role has the required permission
      const hasPermission = rolesWithPermission.some(
        (role) => role.Permissions && role.Permissions.length > 0
      );

      if (!hasPermission) {
        console.log("Access forbidden: Insufficient permissions.", {
          userId: decoded.id,
          requiredApi,
          requiredName,
          requiredModule,
          requiredRoute,
        });
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Permission check failed:", {
        error: error.message,
        userId: decoded?.id,
        requiredApi,
        requiredName,
        requiredModule,
        requiredRoute,
      });
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized: Token expired" });
      }
      if (error.name === "SequelizeDatabaseError") {
        return res.status(500).json({ message: "Database error occurred" });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = checkPermission;
