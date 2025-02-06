const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user"); // Assuming the User model exists
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const RolePermission = sequelize.define("RolePermission", {
  roleId: {
    type: DataTypes.UUID, // Changed to UUID
    primaryKey: true,
    defaultValue: uuidv4, // Automatically generates a UUID
  },
  role_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

// Relationship with User
RolePermission.belongsTo(User, { foreignKey: "userId" });

module.exports = RolePermission;
