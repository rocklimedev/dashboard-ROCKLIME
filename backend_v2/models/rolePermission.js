module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      roleId: {
        type: DataTypes.CHAR(36),
        allowNull: true,
        references: {
          model: "roles",
          key: "roleId",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      permissionId: {
        type: DataTypes.CHAR(36),
        allowNull: true,
        references: {
          model: "permissions",
          key: "permissionId",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "rolepermissions",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["roleId", "permissionId"] },
        { fields: ["permissionId"] },
      ],
    }
  );

  // ---------------------------------------
  // Associations
  // ---------------------------------------
  RolePermission.associate = (models) => {
    // RolePermission → Role (M:1)
    RolePermission.belongsTo(models.Role, {
      foreignKey: "roleId",
      as: "role",
    });

    // RolePermission → Permission (M:1)
    RolePermission.belongsTo(models.Permission, {
      foreignKey: "permissionId",
      as: "permission",
    });
  };

  return RolePermission;
};
