const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users");
const { v4: uuidv4 } = require("uuid");

const RolePermission = sequelize.define("RolePermission", {
  roleId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
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
