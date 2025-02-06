const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Address = sequelize.define("Address", {
  addressId: {
    type: DataTypes.UUID, // Changed to UUID
    primaryKey: true,
    defaultValue: uuidv4, // Auto-generate UUID
  },
  street: {
    type: DataTypes.STRING(255),
  },
  city: {
    type: DataTypes.STRING(100),
  },
  state: {
    type: DataTypes.STRING(100),
  },
  postalCode: {
    type: DataTypes.STRING(20),
  },
  country: {
    type: DataTypes.STRING(100),
  },
});

// Relationship with User (Assuming User's primary key is also UUID)
Address.belongsTo(User, { foreignKey: "userId" });

module.exports = Address;
