const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
        model: "products", // must match actual table name
        key: "productId",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    keywordId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "keywords", // must match actual table name
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "products_keywords",
    timestamps: true, // createdAt + updatedAt
    indexes: [
      {
        name: "idx_productId",
        fields: ["productId"],
      },
      {
        name: "idx_keywordId",
        fields: ["keywordId"],
      },
      {
        name: "unique_product_keyword",
        unique: true,
        fields: ["productId", "keywordId"],
      },
    ],
  }
);

module.exports = ProductKeyword;
