// models/Category.js
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      categoryId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "categoryId",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      brandId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "brandId",
      },
      parentCategoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "parentCategoryId",
      },
    },
    {
      tableName: "categories",
      timestamps: true,
      indexes: [
        { fields: ["brandId"] },
        { fields: ["parentCategoryId"] },
        { unique: true, fields: ["slug"] },
        { unique: true, fields: ["name", "brandId"] }, // prevent duplicates within same brand
      ],
    }
  );

  // -------------------------------------------------
  // ⭐ All associations go inside associate() method
  // -------------------------------------------------
  Category.associate = (models) => {
    // Category → Brand (N:1)
    Category.belongsTo(models.Brand, {
      foreignKey: "brandId",
      as: "brand",
    });

    // Category → ParentCategory (N:1)
    Category.belongsTo(models.ParentCategory, {
      foreignKey: "parentCategoryId",
      as: "parentCategory",
    });

    // Category → Keyword (1:N)
    Category.hasMany(models.Keyword, {
      foreignKey: "categoryId",
      as: "keywords",
    });
  };

  return Category;
};
