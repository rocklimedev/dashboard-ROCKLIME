// models/Brand.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const Brand = sequelize.define(
  "Brand",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    brandName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    brandSlug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "brands",
    timestamps: true,
  }
);

module.exports = Brand;
