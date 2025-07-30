// models/Category.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const ParentCategory = require("./parentCategory");
const Brand = require("./brand");
const Category = sequelize.define(
  "Category",
  {
    // change defaultValue for categoryId to DataTypes.UUIDV4
    categoryId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // ✅
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    brandId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Brand,
        key: "id",
      },
    },

    parentCategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: ParentCategory, // ✅ this uses the actual model
        key: "id",
      },
    },
  },
  {
    tableName: "categories",
    timestamps: true,
  }
);

module.exports = Category;
