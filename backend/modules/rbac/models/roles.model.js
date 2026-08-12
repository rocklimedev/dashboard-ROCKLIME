module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      roleId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      roleName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "roles",
      timestamps: true,
    }
  );

  // ---------------------------------------
  // Associations
  // ---------------------------------------
  Role.associate = (models) => {
    // Role ↔ Permission (M:N through RolePermission)
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: "roleId",
      otherKey: "permissionId",
      as: "permissions",
    });

    Role.hasMany(models.RolePermission, {
      foreignKey: "roleId",
      as: "rolepermissions",
    });

    // Role ↔ User (1:M)
    Role.hasMany(models.User, {
      foreignKey: "roleId",
      as: "users",
    });
  };

  return Role;
};
