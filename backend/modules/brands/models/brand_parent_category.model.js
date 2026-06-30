// models/BrandParentCategory.js
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const BrandParentCategory = sequelize.define(
    "BrandParentCategory",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      // If this is a pure join table, remove name + slug.
      // If it's a real entity, keep them.
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

  // ------------------------------------------------
  // ⭐ All associations inside associate()
  // ------------------------------------------------
  BrandParentCategory.associate = (models) => {
    // BrandParentCategory ↔ Brand (M:N)
    BrandParentCategory.belongsToMany(models.Brand, {
      through: models.BrandParentCategoryBrand,
      foreignKey: "brandParentCategoryId",
      otherKey: "brandId",
      as: "brands",
    });

    // BrandParentCategory → ParentCategory (1:N)
    BrandParentCategory.hasMany(models.ParentCategory, {
      foreignKey: "brandParentCategoryId",
      as: "parentCategories",
    });
  };

  return BrandParentCategory;
};
