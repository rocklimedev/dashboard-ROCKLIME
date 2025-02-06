const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Invoice = sequelize.define(
  "Invoice",
  {
    invoiceId: {
      type: DataTypes.UUID, // Changed to UUID
      primaryKey: true,
      defaultValue: uuidv4, // Auto-generate UUID
    },
    client: {
      type: DataTypes.UUID, // Assuming userId is UUID in the 'users' table
      references: {
        model: "users", // Table name of user
        key: "userId", // Reference to userId in users table
      },
    },
    billTo: {
      type: DataTypes.STRING(255),
      allowNull: true, // Can be a custom name or user name
    },
    shipTo: {
      type: DataTypes.UUID, // Assuming addressId is UUID in the 'addresses' table
      references: {
        model: "addresses", // Table name of address
        key: "addressId", // Reference to addressId in addresses table
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // Invoice amount
    },
    orderNumber: {
      type: DataTypes.STRING(100),
      allowNull: true, // Can link to orderName in orders table
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false, // Exact date of the invoice
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false, // Due date to submit the order
    },
    paymentMethod: {
      type: DataTypes.JSON, // Store array of payment methods
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("paid", "unpaid", "partially paid"),
      allowNull: false, // Payment status
    },
    orderId: {
      type: DataTypes.UUID, // Changed to UUID for consistency
      references: {
        model: "orders", // Table name of orders
        key: "orderNama", // Reference to orderNama in orders table (assuming it's UUID)
      },
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false, // Array of products from the order
    },
    signatureName: {
      type: DataTypes.STRING(255),
      allowNull: true, // Signature name, linked to signature table
    },
  },
  {
    tableName: "invoices",
    timestamps: false, // Set to true if you need createdAt and updatedAt fields
  }
);

module.exports = Invoice;
