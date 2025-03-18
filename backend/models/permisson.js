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
      allowNull: false, // This will represent the name of the whole module (router)
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["route", "name"], // Ensure the combination is unique, not just route
      },
      {
        fields: ["module"], // Index for faster queries on the module
      },
    ],
  }
);

module.exports = Permission;
