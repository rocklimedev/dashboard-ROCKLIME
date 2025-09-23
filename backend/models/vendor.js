const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const Brand = require("../models/brand");

const Vendor = sequelize.define(
  "Vendor",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(), // <-- must be a function
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
    tableName: "vendors",
    timestamps: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    engine: "InnoDB",
  }
);

module.exports = Vendor;
