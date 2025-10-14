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
    reference_number: {
      type: DataTypes.STRING(50),
    },

    // ✅ Re-added fields
    include_gst: {
      type: DataTypes.BOOLEAN, // TINYINT(1) equivalent
      allowNull: true,
      defaultValue: null,
    },
    gst_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
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
      allowNull: true, // Optional, as shipping address may not always be required
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
