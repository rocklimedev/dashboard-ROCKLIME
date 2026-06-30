// models/permission.js
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define(
    "Permission",
    {
      permissionId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, // Sequelize's built-in UUIDV4
      },
      api: {
        type: DataTypes.ENUM("view", "delete", "write", "edit", "export"),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Human-readable name for the permission",
      },
      route: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: "Actual route path like /user/create or /orders/export",
      },
      module: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "permissions",
      timestamps: true,
    }
  );

  // -------------------------------
  // Associations
  // -------------------------------
  Permission.associate = (models) => {
    // Fixed: Use correct alias for the reverse relationship
    Permission.hasMany(models.RolePermission, {
      foreignKey: "permissionId",
      as: "rolepermission_links", // ← any unique name, NOT "rolepermissions"
    });

    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: "permissionId",
      otherKey: "roleId",
      as: "roles",
    });
  };

  return Permission;
};
