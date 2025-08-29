// models/ProductMeta.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductMeta = sequelize.define(
  "ProductMeta",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Label for the metadata field (e.g., Selling Price, MRP)",
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    fieldType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Type of data (e.g., string, number, mm, inch, pcs, box, feet)",
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Optional unit of measurement (e.g., inch, mm, pcs)",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "product_metas",
    timestamps: false,
  }
);

module.exports = ProductMeta;
