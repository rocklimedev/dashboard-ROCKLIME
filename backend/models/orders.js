const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./team");
const Customer = require("./customers");
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
        key: "customerId", // Fix: Use correct primary key
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "userId", // Fix: Use correct primary key
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
      allowNull: true, // Fix: Make nullable
    },
    followupDates: {
      type: DataTypes.JSON, // Store array as JSON
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
    },
    priority: {
      type: DataTypes.ENUM("high", "medium", "low"),
      defaultValue: "medium",
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
