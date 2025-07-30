const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BrandParentCategory = sequelize.define(
  "BrandParentCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // ✅ prefer this
      primaryKey: true,
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
  },
  {
    tableName: "brand_parentcategories",
    timestamps: true,
  }
);

module.exports = BrandParentCategory;
