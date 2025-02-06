const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // assuming you have a sequelize instance
const { v4: uuidv4 } = require("uuid"); // Importing UUID library for generating UUIDs

const User = sequelize.define("User", {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4, // Automatically generate a UUID when creating a new record
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  mobileNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("superadmin", "admin", "Accounts", "users", "staff"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "restricted"),
    allowNull: false,
  },
});

module.exports = User;
