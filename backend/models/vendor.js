const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const Brand = require("../models/brand");

const Vendor = sequelize.define(
  "Vendor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    vendorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brandId: {
      type: DataTypes.UUID,
      references: {
        model: Brand,
        key: "id",
      },
    },
    brandSlug: {
      type: DataTypes.STRING,
      references: {
        model: Brand,
        key: "brandSlug", // Fixed Syntax
      },
    },
  },
  {
    tableName: "vendors", // Force lowercase table name
    timestamps: true,
  }
);

module.exports = Vendor;
