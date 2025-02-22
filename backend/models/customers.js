const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Sequelize instance
const { INVOICE_STATUS } = require("../config/constant");

const Customer = sequelize.define(
  "Customer",
  {
    customerId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    name: { type: DataTypes.STRING(100), allowNull: false }, // Customer's full name
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    mobileNumber: { type: DataTypes.STRING(20), allowNull: false },

    companyName: { type: DataTypes.STRING(150), allowNull: true }, // Customer's company
    address: { type: DataTypes.JSON, allowNull: true }, // Store address in JSON format

    quotations: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: true }, // References Quotation model
    invoices: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: true }, // References Invoice model

    isVendor: { type: DataTypes.BOOLEAN, defaultValue: false }, // If true, vendor details exist
    vendorId: { type: DataTypes.UUID, allowNull: true }, // References Vendor model if applicable

    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 }, // Total transaction amount
    paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 }, // Amount paid
    balance: { type: DataTypes.FLOAT, defaultValue: 0 }, // Remaining balance
    dueDate: { type: DataTypes.DATE, allowNull: true }, // Payment due date
    paymentMode: { type: DataTypes.STRING(50), allowNull: true }, // Payment method (cash, card, etc.)

    invoiceStatus: {
      type: DataTypes.ENUM(...Object.values(INVOICE_STATUS)), // Invoice status
      allowNull: true,
    },
  },
  { timestamps: true }
);

module.exports = Customer;
