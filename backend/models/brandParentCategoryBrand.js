// models/brandParentCategoryBrand.js
module.exports = (sequelize, DataTypes) => {
  const BrandParentCategoryBrand = sequelize.define(
    "BrandParentCategoryBrand",
    {
      brandParentCategoryId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "brand_parentcategories",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      brandId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "brands",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "brand_parentcategory_brands",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["brandParentCategoryId", "brandId"], // Prevents duplicates
        },
      ],
    }
  );

  return BrandParentCategoryBrand;
};
