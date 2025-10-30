const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Role = require("../models/roles");
const Permission = require("../models/permisson");
const CachedPermission = require("../models/cachedPermission"); // <-- new Mongo model
require("dotenv").config();

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
      if (!decoded.userId)
        return res.status(401).json({ message: "Unauthorized: Invalid token" });

      // 2️⃣ Check Mongo Cache First
      let cached = await CachedPermission.findOne({ userId: decoded.userId });

      // 3️⃣ If cache exists and is fresh (< 24 hours), use it
      const isFresh =
        cached && new Date() - new Date(cached.fetchedAt) < 24 * 60 * 60 * 1000;

      if (!isFresh) {
        // 4️⃣ Otherwise, fetch from SQL
        const user = await User.findByPk(decoded.userId, {
          include: [
            {
              model: Role,
              include: [
                {
                  model: Permission,
                  through: { attributes: [] },
                },
              ],
            },
          ],
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        const roles = user.Roles || [];

        // Flatten all permissions
        const permissions = roles.flatMap((r) =>
          r.Permissions.map((perm) => ({
            permissionId: perm.permissionId,
            name: perm.name,
            api: perm.api,
            route: perm.route,
            module: perm.module,
          }))
        );

        // Update Mongo Cache
        await CachedPermission.findOneAndUpdate(
          { userId: decoded.userId },
          {
            roleId: roles[0]?.roleId,
            roleName: roles[0]?.roleName || null,
            permissions,
            fetchedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        cached = await CachedPermission.findOne({ userId: decoded.userId });
      }

      // 5️⃣ Super Admin Bypass
      if (cached?.roleName?.toUpperCase() === "SUPER_ADMIN") return next();

      // 6️⃣ Validate middleware config
      if (!api || !name || !module || !route) {
        return res
          .status(500)
          .json({ message: "Invalid permission configuration in route" });
      }

      // 7️⃣ Check if permission exists in cache
      const hasPermission = cached.permissions.some(
        (perm) =>
          perm.api === api &&
          perm.name === name &&
          perm.module === module &&
          perm.route === route
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Forbidden: Missing permission "${name}" (${api.toUpperCase()} - ${module})`,
        });
      }

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
