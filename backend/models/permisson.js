const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Permission = sequelize.define("Permission", {
  permissionId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
  },
  route: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // Each API route should be unique
  },
  name: {
    type: DataTypes.ENUM("view", "delete", "write", "edit"),
    allowNull: false, // Defines the type of access for the route
  },
});

module.exports = Permission;
