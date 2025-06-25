const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid");
// Many-to-many between Brand and ParentCategory
const BrandParentCategory = sequelize.define(
  "BrandParentCategory",
  {
    brandId: {
      type: DataTypes.UUID,
      references: {
        model: "brands",
        key: "id",
      },
      primaryKey: true,
    },
    parentCategoryId: {
      type: DataTypes.UUID,
      references: {
        model: "parentcategories",
        key: "id",
      },
      primaryKey: true,
    },
  },
  {
    tableName: "brand_parentcategories",
    timestamps: false,
  }
);

module.exports = BrandParentCategory;
