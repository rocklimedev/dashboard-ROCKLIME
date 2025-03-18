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

    permissions: {
      type: DataTypes.JSONB, // Use JSONB for efficient querying if supported by your DB
      allowNull: false,
      defaultValue: [], // Default to empty array or any default structure
    },
  },
  {
    tableName: "rolepermissions",
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  }
);

module.exports = RolePermission;
