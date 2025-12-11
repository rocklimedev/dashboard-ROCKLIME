// models/ParentCategory.js
module.exports = (sequelize, DataTypes) => {
  const ParentCategory = sequelize.define(
    "ParentCategory",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          is: /^[a-z0-9-]+$/i,
        },
      },
    },
    {
      tableName: "parentcategories",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["name"] },
        { unique: true, fields: ["slug"] },
      ],
      hooks: {
        beforeValidate: (category) => {
          if (category.name && !category.slug) {
            category.slug = category.name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/gi, "-")
              .replace(/^-|-$/g, "");
          }
        },
      },
    }
  );

  // -------------------------------
  // Associations
  // -------------------------------
  ParentCategory.associate = (models) => {
    // ParentCategory ↔ Brand (M:N) through BrandParentCategory
    ParentCategory.belongsToMany(models.Brand, {
      through: models.BrandParentCategory,
      foreignKey: "parentCategoryId",
      otherKey: "brandId",
      as: "brands",
    });

    // Optional: access raw join table
    ParentCategory.hasMany(models.BrandParentCategory, {
      foreignKey: "parentCategoryId",
      as: "brandParentCategories",
    });

    // ParentCategory → Category (1:M)
    ParentCategory.hasMany(models.Category, {
      foreignKey: "parentCategoryId",
      as: "categories",
    });
  };

  return ParentCategory;
};
