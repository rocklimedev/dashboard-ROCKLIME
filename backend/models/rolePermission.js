// models/RolePermission.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
      allowNull: true, // Schema allows NULL, but we’ll enforce NOT NULL later
      references: {
        model: "roles",
        key: "roleId",
      },
    },
    permissionId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: "permissions",
        key: "permissionId",
      },
    },
  },
  {
    tableName: "rolepermissions",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["roleId", "permissionId"],
      },
      {
        fields: ["permissionId"],
      },
    ],
  }
);

module.exports = RolePermission;
