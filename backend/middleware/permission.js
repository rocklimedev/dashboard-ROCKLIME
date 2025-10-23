// middleware/checkPermission.js
const jwt = require("jsonwebtoken");
const Role = require("../models/roles");
const Permission = require("../models/permisson");
const RolePermission = require("../models/rolePermission");

const checkPermission = (api, name, module, route) => {
  return async (req, res, next) => {
    try {
      // 1️⃣ Extract JWT
      const token = req.headers.authorization?.split(" ")[1];
      if (!token)
        return res
          .status(401)
          .json({ message: "Unauthorized: No token provided" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.id)
        return res.status(401).json({ message: "Unauthorized: Invalid token" });

      // 2️⃣ Fetch user with roles + permissions in a single query
      const user = await User.findByPk(decoded.id, {
        include: {
          model: Role,
          include: Permission,
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      const roles = user.Roles || [];

      // 3️⃣ Super Admin bypass
      const isSuperAdmin = roles.some(
        (r) => r.roleName.toUpperCase() === "SUPER_ADMIN"
      );
      if (isSuperAdmin) return next();

      // 4️⃣ Validate middleware parameters
      if (!api || !name || !module || !route) {
        return res
          .status(500)
          .json({ message: "Invalid permission configuration" });
      }

      // 5️⃣ Check if any role has this exact permission
      const hasPermission = roles.some((role) =>
        role.Permissions.some(
          (perm) =>
            perm.api === api &&
            perm.name === name &&
            perm.module === module &&
            perm.route === route
        )
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Forbidden: Role lacks permission "${name}" (${api.toUpperCase()} - ${module})`,
        });
      }

      // 6️⃣ Pass control
      next();
    } catch (error) {
      console.error("checkPermission Error:", error);

      if (error.name === "JsonWebTokenError")
        return res.status(401).json({ message: "Invalid token" });

      if (error.name === "TokenExpiredError")
        return res.status(401).json({ message: "Token expired" });

      return res.status(500).json({ message: "Permission validation failed" });
    }
  };
};

module.exports = checkPermission;
