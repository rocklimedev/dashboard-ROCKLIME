const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { v4: uuidv4 } = require("uuid"); // Importing UUID library

const Category = sequelize.define("Category", {
  categoryId: {
    type: DataTypes.UUID, // Changed to UUID
    primaryKey: true,
    defaultValue: uuidv4, // Auto-generate UUID
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  total_products: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  parentCategory: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  parentCategoryName: {
    type: DataTypes.UUID, // Changed to UUID, referencing parent category's UUID
  },
});

module.exports = Category;
