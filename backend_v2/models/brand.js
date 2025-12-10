// models/Brand.js
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define(
    "Brand",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
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
      indexes: [
        { unique: true, fields: ["brandName"] },
        { unique: true, fields: ["brandSlug"] },
      ],
    }
  );

  // --------------------------------------------------
  // ⭐ Correct associations go inside associate()
  // --------------------------------------------------
  Brand.associate = (models) => {
    // Brand → Vendor (1:N)
    Brand.hasMany(models.Vendor, {
      foreignKey: "brandId",
      as: "vendors",
    });

    // Brand ↔ BrandParentCategory (M:N)
    Brand.belongsToMany(models.BrandParentCategory, {
      through: models.BrandParentCategoryBrand,
      foreignKey: "brandId",
      otherKey: "brandParentCategoryId",
      as: "brandParentCategories",
    });

    // Brand → Category (1:N)
    Brand.hasMany(models.Category, {
      foreignKey: "brandId",
      as: "categories",
    });
  };

  return Brand;
};
