const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Category = require("./category"); // Assuming the Category model exists
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Product = sequelize.define("Product", {
  productId: {
    type: DataTypes.UUID, // Changed to UUID
    primaryKey: true,
    defaultValue: uuidv4, // Automatically generates a UUID
  },
  itemType: {
    type: DataTypes.ENUM("product", "service"),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  purchasingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discountType: {
    type: DataTypes.ENUM("percent", "fixed"),
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  alert_quantity: {
    type: DataTypes.INTEGER,
  },
  tax: {
    type: DataTypes.DECIMAL(5, 2),
  },
  description: {
    type: DataTypes.TEXT,
  },
  images: {
    type: DataTypes.JSON,
  },
});

// Relationship with Category
Product.belongsTo(Category, { foreignKey: "categoryId" });

module.exports = Product;
