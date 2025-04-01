const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./team");
const Customer = require("./customers"); // Assuming a Customer model exists
const User = require("./users");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    createdFor: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Customer,
        key: "customerId",
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
    },
    title: { type: DataTypes.STRING, allowNull: false },
    pipeline: {
      type: DataTypes.JSON,
      allowNull: true, // Store array as JSON
    },
    status: {
      type: DataTypes.ENUM(
        "CREATED",
        "PREPARING",
        "CHECKING",
        "INVOICE",
        "DISPATCHED",
        "DELIVERED",
        "PARTIALLY_DELIVERED",
        "CANCELED"
      ),
      defaultValue: "CREATED",
    },
    dueDate: {
      type: DataTypes.DATEONLY,
    },
    assignedTo: {
      type: DataTypes.UUID,
      references: {
        model: Team,
        key: "id",
      },
      allowNull: false, // Store array as JSON
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
  },
  {
    tableName: "orders", // Force lowercase table name
    timestamps: true,
  }
);

module.exports = Order;
