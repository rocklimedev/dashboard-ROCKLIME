const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Signature = sequelize.define("Signature", {
  signatureId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4, // Automatically generates a UUID
  },
  signature_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  signature_image: {
    type: DataTypes.BLOB("long"), // Changed from TEXT to BLOB to store images
    allowNull: false,
  },
  mark_as_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
});

// Relationship with User
Signature.belongsTo(User, { foreignKey: "userId" });

module.exports = Signature;
