const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Permission = require("../models/permisson");

const checkPermission = (requiredAction) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, { include: ["roles"] });

      if (!user) return res.status(401).json({ message: "User not found" });

      // Fetch user's permissions based on their role
      const userPermissions = await Permission.findAll({
        where: { roleId: user.roleId },
      });

      // Check if the required action is in the user's permissions
      const hasPermission = userPermissions.some(
        (perm) => perm.action === requiredAction
      );

      if (!hasPermission)
        return res.status(403).json({ message: "Forbidden: No permission" });

      next();
    } catch (error) {
      console.error("Permission check failed:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = checkPermission;
