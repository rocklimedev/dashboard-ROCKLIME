const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users"); // Import User model
const Customer = require("./customers"); // Import Customer model
const { v4: uuidv4 } = require("uuid");

const Quotation = sequelize.define("Quotation", {
  quotationId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: uuidv4,
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "userId",
    },
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: "customerId",
    },
  },
});

// Define Correct Relationships
Quotation.belongsTo(User, { foreignKey: "createdBy", as: "creator" }); // User who created the quotation
Quotation.belongsTo(Customer, { foreignKey: "customerId", as: "customer" }); // Customer for whom the quotation is made

module.exports = Quotation;
