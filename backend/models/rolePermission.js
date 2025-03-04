const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const Permission = require("./permisson"); // Importing Permission model

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
});

// Many-to-Many Relationship Between Roles and Permissions

module.exports = Role;
