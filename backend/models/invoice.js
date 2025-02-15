const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library
const Order = require("./orders"); // Import Order model

const Invoice = sequelize.define(
  "Invoice",
  {
    invoiceId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4, // Auto-generate UUID
    },
    client: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "userId",
      },
    },
    billTo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    shipTo: {
      type: DataTypes.UUID,
      references: {
        model: "addresses",
        key: "addressId",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    orderNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("paid", "unpaid", "partially paid"),
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID, // Ensure this matches the primary key type in Order
      references: {
        model: Order, // Correct reference to Order model
        key: "id", // Fix: Reference the correct column `id` instead of `orderNama`
      },
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    signatureName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "invoices",
    timestamps: false,
  }
);

module.exports = Invoice;
