const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library
const Order = require("./orders"); // Import Order model
const Customer = require("./customers");
const Address = require("./address");
const User = require("./users");

const Invoice = sequelize.define(
  "Invoice",
  {
    invoiceId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4, // Auto-generate UUID
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: "userId",
      },
    },
    orderId: {
      type: DataTypes.UUID,
      references: {
        model: Order,
        key: "id",
      },
      allowNull: false,
    },
    billTo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shipTo: {
      type: DataTypes.UUID,
      references: {
        model: Address,
        key: "addressId",
      },
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isBeforeDueDate(value) {
          if (this.dueDate && value >= this.dueDate) {
            throw new Error("Invoice date must be before the due date.");
          }
        },
      },
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.JSON, // Store mode of payment (UPI, card, etc.)
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "paid",
        "unpaid",
        "partially paid",
        "void",
        "refund"
      ),
      allowNull: false,
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    signatureName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "CM TRADING CO",
    },
  },
  {
    tableName: "invoices",
    timestamps: false,
  }
);

module.exports = Invoice;
