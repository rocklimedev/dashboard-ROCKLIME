const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const Order = require("./orders");
const Customer = require("./customers");
const Address = require("./address");
const User = require("./users");
const Quotation = require("./quotation");

const Invoice = sequelize.define(
  "Invoice",
  {
    invoiceId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4,
    },
    invoiceNo: {
      type: DataTypes.STRING,
      allowNull: true, // ← change this
      unique: true,
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
      allowNull: true,
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
    timestamps: true,
  }
);

Invoice.beforeCreate(async (invoice, options) => {
  let unique = false;

  while (!unique) {
    const randomNumber = crypto.randomInt(100000, 999999); // More secure RNG
    const generatedNo = `INV_${randomNumber}`;

    const existing = await Invoice.findOne({
      where: { invoiceNo: generatedNo },
    });

    if (!existing) {
      invoice.invoiceNo = generatedNo;
      unique = true;
    }
  }
});

module.exports = Invoice;
