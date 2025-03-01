const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Role = sequelize.define("Role", {
  roleId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
  },
  roleName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}, // Default to an empty object (e.g., { "CREATE_USER": true, "DELETE_ORDER": false })
  },
});

module.exports = Role;
