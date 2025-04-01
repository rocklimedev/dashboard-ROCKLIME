const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid"); // Import UUID function

const Permission = sequelize.define(
  "Permission",
  {
    permissionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4, // Use UUIDv4 for default value
    },
    route: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM("view", "delete", "write", "edit", "export"),
      allowNull: false,
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
