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

    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    mobileNumber: { type: DataTypes.STRING(20), allowNull: false },
    phone2: { type: DataTypes.STRING(20), allowNull: true }, // Added second phone

    companyName: { type: DataTypes.STRING(150), allowNull: true },

    // New field for customer type dropdown
    customerType: {
      type: DataTypes.ENUM(
        "Retail",
        "Architect",
        "Interior",
        "Builder",
        "Contractor"
      ),
      allowNull: true,
    },

    address: { type: DataTypes.JSON, allowNull: true },

    quotations: { type: DataTypes.JSON, allowNull: true },
    invoices: { type: DataTypes.JSON, allowNull: true },

    isVendor: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendorId: { type: DataTypes.UUID, allowNull: true },

    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    balance: { type: DataTypes.FLOAT, defaultValue: 0 },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    paymentMode: { type: DataTypes.STRING(50), allowNull: true },

    invoiceStatus: {
      type: DataTypes.ENUM(...Object.values(INVOICE_STATUS)),
      allowNull: true,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  }
);

module.exports = Customer;
