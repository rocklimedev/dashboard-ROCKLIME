// models/ProductKeyword.js
module.exports = (sequelize, DataTypes) => {
  const ProductKeyword = sequelize.define(
    "ProductKeyword",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "products", // matches table name
          key: "productId",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      keywordId: {
        type: DataTypes.UUID,
        allowNull: false,
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
        {
          name: "unique_product_keyword",
          unique: true,
          fields: ["productId", "keywordId"],
        },
      ],
    }
  );

  ProductKeyword.associate = (models) => {
    // Join table → belongsTo both sides
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
