const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Quotation = require("./quotation"); // Assuming Quotation exists

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },

  title: { type: DataTypes.STRING, allowNull: false },
  pipeline: {
    type: DataTypes.JSON, // Store array as JSON
  },
  status: {
    type: DataTypes.ENUM(
      "CREATED",
      "PREPARING",
      "CHECKING",
      "INVOICE",
      "DISPATCHED",
      "DELIVERED",
      "PARTIALLY_DELIVERED"
    ),
    defaultValue: "CREATED",
  },
  dueDate: {
    type: DataTypes.DATEONLY,
  },
  assigned: {
    type: DataTypes.JSON, // Store array as JSON
  },
  followupDates: {
    type: DataTypes.JSON, // Store array as JSON
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
