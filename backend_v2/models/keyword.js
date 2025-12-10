// models/Keyword.js
module.exports = (sequelize, DataTypes) => {
  const Keyword = sequelize.define(
    "Keyword",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      keyword: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "keywords",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["keyword"] },
        { fields: ["categoryId"] },

        // trigram index (only respected by Postgres)
        {
          name: "idx_keyword_trgm",
          fields: ["keyword"],
          using: "GIN",
          operator: "gin_trgm_ops",
        },
      ],
      hooks: {
        beforeValidate: (kw) => {
          if (kw.keyword) {
            kw.keyword = kw.keyword.trim().toLowerCase();
          }
        },
      },
    }
  );

  // ----------------------------------------
  // All Associations Here
  // ----------------------------------------
  Keyword.associate = (models) => {
    // Keyword → Category (M:1)
    Keyword.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });

    // Keyword ↔ Product (M:N)
    Keyword.belongsToMany(models.Product, {
      through: models.ProductKeyword,
      foreignKey: "keywordId",
      otherKey: "productId",
      as: "products",
    });

    // Keyword → ProductKeyword (1:M)
    Keyword.hasMany(models.ProductKeyword, {
      foreignKey: "keywordId",
      as: "productKeywordMappings",
    });
  };

  return Keyword;
};
