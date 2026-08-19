const { Role, RolePermission, Permission } = require("./auth.helpers");

/**
 * Get all permissions assigned to the logged-in user's role
 * Assumes: req.user is populated by authentication middleware
 *          req.user.roleId exists
 */
exports.getAllPermissionsOfLoggedInUser = async (req, res) => {
  try {
    const { roleId, name, email } = req.user;

    if (!roleId) {
      return res.status(403).json({ message: "User role not found" });
    }

    const role = await Role.findByPk(roleId, {
      attributes: ["roleId", "roleName"],
      include: [
        {
          model: RolePermission,
          as: "rolepermissions",
          attributes: ["permissionId"],
          include: [
            {
              model: Permission,
              as: "permission", // ← matches belongsTo in RolePermission
              attributes: ["permissionId", "name", "api", "route", "module"],
            },
          ],
        },
      ],
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Safety: check if rolepermissions exists and has data
    const permissions = (role.rolepermissions || [])
      .map((rp) => {
        return {
          permissionId: rp.permission.permissionId,
          name: rp.permission.name,
          action: rp.permission.api,
          route: rp.permission.route,
          module: rp.permission.module,
        };
      })
      .filter(Boolean); // remove nulls

    return res.status(200).json({
      permissions,
      role: role.roleName,
      roleId: role.roleId,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch permissions",
      error: err.message,
    });
  }
};
