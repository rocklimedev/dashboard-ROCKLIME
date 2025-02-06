const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Quotation = require("./quotation"); // Assuming Quotation exists
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Order = sequelize.define("Order", {
  orderNama: {
    type: DataTypes.UUID, // Changed to UUID
    primaryKey: true,
    defaultValue: uuidv4, // Automatically generates a UUID
  },
  pipeline: {
    type: DataTypes.ARRAY(DataTypes.STRING), // or DataTypes.JSON for array
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "cancelled"),
  },
  dueDate: {
    type: DataTypes.DATEONLY,
  },
  assigned: {
    type: DataTypes.ARRAY(DataTypes.STRING), // or DataTypes.JSON for array
  },
  followupDates: {
    type: DataTypes.ARRAY(DataTypes.DATEONLY), // or DataTypes.JSON for array
  },
  source: {
    type: DataTypes.STRING,
  },
  priority: {
    type: DataTypes.ENUM("high", "medium", "low"),
  },
  description: {
    type: DataTypes.TEXT,
  },
});

// Relationship with Quotation
Order.belongsTo(Quotation, { foreignKey: "quotationId" });

module.exports = Order;
