const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users"); // Assuming User exists
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Quotation = sequelize.define("Quotation", {
  quotationId: {
    type: DataTypes.UUID, // Changed to UUID
    primaryKey: true,
    defaultValue: uuidv4, // Automatically generates a UUID
  },
  document_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  quotation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reference_number: {
    type: DataTypes.STRING(50),
  },
  include_gst: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  gst_value: {
    type: DataTypes.DECIMAL(10, 2),
  },
  products: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  discountType: {
    type: DataTypes.ENUM("percent", "fixed"),
  },
  roundOff: {
    type: DataTypes.DECIMAL(10, 2),
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  signature_name: {
    type: DataTypes.STRING(255),
  },
  signature_image: {
    type: DataTypes.TEXT,
  },
});

// Relationship with User
Quotation.belongsTo(User, { foreignKey: "customerId" });

module.exports = Quotation;
