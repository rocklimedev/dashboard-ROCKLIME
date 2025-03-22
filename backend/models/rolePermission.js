const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
  },
  {
    tableName: "rolepermissions",
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  }
);

module.exports = RolePermission;
