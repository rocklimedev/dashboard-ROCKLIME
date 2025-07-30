// models/brandParentCategoryBrand.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BrandParentCategoryBrand = sequelize.define(
  "BrandParentCategoryBrand",
  {
    brandParentCategoryId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: "brand_parentcategories",
        key: "id",
      },
    },
    brandId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: "brands",
        key: "id",
      },
    },
  },
  {
    tableName: "brand_parentcategory_brands",
    timestamps: false,
  }
);

module.exports = BrandParentCategoryBrand;
