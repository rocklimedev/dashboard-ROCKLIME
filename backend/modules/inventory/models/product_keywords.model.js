// models/ProductKeyword.js
module.exports = (sequelize, DataTypes) => {
  const ProductKeyword = sequelize.define(
    "ProductKeyword",
    {
      // REMOVE THE SURROGATE ID COMPLETELY
      // id: { ... } ← delete this whole block

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true, // ← now part of composite PK
        references: {
          model: "products",
          key: "productId",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      keywordId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true, // ← now part of composite PK
        references: {
          model: "keywords",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "products_keywords",
      timestamps: true,
      indexes: [
        { name: "idx_productId", fields: ["productId"] },
        { name: "idx_keywordId", fields: ["keywordId"] },
        // this unique index is still prevents duplicates
        {
          name: "unique_product_keyword",
          unique: true,
          fields: ["productId", "keywordId"],
        },
      ],
    }
  );

  ProductKeyword.associate = (models) => {
    ProductKeyword.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });

    ProductKeyword.belongsTo(models.Keyword, {
      foreignKey: "keywordId",
      as: "keyword",
    });
  };

  return ProductKeyword;
};
