const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Permission = require("../models/permisson");
const Role = require("../models/rolePermission");
const { ROLES } = require("../config/constant");

const checkPermission = (
  requiredApi,
  requiredName,
  requiredModule,
  requiredRoute
) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, { include: ["roles"] });

      if (!user) return res.status(401).json({ message: "User not found" });

      // ✅ Super Admin bypass
      const userRoles = await user.getRoles();
      if (userRoles.some((role) => role.name === ROLES.SuperAdmin)) {
        console.log("Super Admin detected, bypassing permission check.");
        return next();
      }

      // ✅ Check permissions with all 3 fields
      const rolesWithPermission = await user.getRoles({
        include: [
          {
            model: Permission,
            where: {
              api: requiredApi,
              name: requiredName,
              module: requiredModule,
              route: requiredRoute,
            },
          },
        ],
      });

      if (rolesWithPermission.length === 0) {
        return res.status(403).json({ message: "Forbidden: No permission" });
      }

      next();
    } catch (error) {
      console.error("Permission check failed:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = checkPermission;
