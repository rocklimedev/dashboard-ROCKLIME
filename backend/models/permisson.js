const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Permission = sequelize.define("Permission", {
  permissionId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true, // Example: "CREATE_USER", "DELETE_ORDER"
  },
});

module.exports = Permission;
