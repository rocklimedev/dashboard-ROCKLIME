const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library
const Vendor = require("./vendor");
const ParentCategory = require("./parentCategory");
const Category = sequelize.define(
  "Category",
  {
    categoryId: {
      type: DataTypes.UUID, // Changed to UUID
      primaryKey: true,
      defaultValue: uuidv4, // Auto-generate UUID
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    parentCategory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    parentCategoryId: {
      type: DataTypes.UUID,
      references: {
        model: ParentCategory,
        key: "id",
      },
      allowNull: true, // Can be null for parent categories
    },
  },
  {
    tableName: "categories", // Force lowercase table name
    timestamps: true,
  }
);

module.exports = Category;
