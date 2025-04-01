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
    brandSlug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    brandName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "brands", // Force lowercase table name
    timestamps: true,
  }
);

module.exports = Brand;
