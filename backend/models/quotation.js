const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users");
const Customer = require("./customers");
const Address = require("./address"); // Import Address model
const { v4: uuidv4 } = require("uuid");

const Quotation = sequelize.define(
  "Quotation",
  {
    quotationId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4,
    },
    document_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quotation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    followupDates: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: "Array of follow-up date objects or timestamps",
    },
    reference_number: {
      type: DataTypes.STRING(50),
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment:
        "Stores either fixed amount or percentage; interpretation handled in frontend",
    },
    roundOff: {
      type: DataTypes.DECIMAL(10, 2),
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    signature_name: {
      type: DataTypes.STRING(255),
    },
    signature_image: {
      type: DataTypes.TEXT,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "userId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Customer,
        key: "customerId",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    shipTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Address,
        key: "addressId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "quotations",
    timestamps: true,
  }
);

module.exports = Quotation;
