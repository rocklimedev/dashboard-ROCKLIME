const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./users");
const Customer = require("./customers");
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
    reference_number: {
      type: DataTypes.STRING(50),
    },
    include_gst: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    gst_value: {
      type: DataTypes.DECIMAL(10, 2),
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    discountType: {
      type: DataTypes.ENUM("percent", "fixed"),
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
      allowNull: true, // Allow null to avoid foreign key conflict
      references: {
        model: User,
        key: "userId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false, // It cannot be null
      references: {
        model: Customer,
        key: "customerId",
      },
      onDelete: "RESTRICT", // Prevent deletion if referenced
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "quotations", // Force lowercase table name
    timestamps: true,
  }
);

module.exports = Quotation;
