// models/ParentCategory.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const ParentCategory = sequelize.define(
  "ParentCategory",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuidv4,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    brandId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "brands", // References the 'brands' table
        key: "id",
      },
    },
  },
  {
    tableName: "parentcategories",
    timestamps: true,
  }
);

module.exports = ParentCategory;
