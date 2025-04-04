const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const Order = require("./orders");
const Customer = require("./customers");
const Address = require("./address");
const User = require("./users");
const Quotation = require("./quotation"); // Ensure you have this model

const Invoice = sequelize.define(
  "Invoice",
  {
    invoiceId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4,
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: "userId",
      },
    },

    quotationId: {
      type: DataTypes.UUID,
      references: {
        model: Quotation,
        key: "quotationId",
      },
      allowNull: true, // Optional field
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
