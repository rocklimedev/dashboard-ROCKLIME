const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Permission = sequelize.define(
  "Permission",
  {
    permissionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4,
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

module.exports = Permission;
