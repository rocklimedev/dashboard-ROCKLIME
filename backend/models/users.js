const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // assuming you have a sequelize instance
const { v4: uuidv4 } = require("uuid"); // Importing UUID library for generating UUIDs

const User = sequelize.define(
  "User",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    mobileNumber: { type: DataTypes.STRING(20), allowNull: true },
    role: {
      type: DataTypes.ENUM("superadmin", "admin", "Accounts", "users", "staff"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "restricted"),
      allowNull: false,
    },
    password: { type: DataTypes.STRING, allowNull: false }, // Hashed password
    role_id: { type: DataTypes.UUID, allowNull: true },
  },
  { timestamps: true }
);

module.exports = User;
