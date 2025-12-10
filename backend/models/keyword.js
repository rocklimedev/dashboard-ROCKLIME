// models/keyword.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "categories",
        key: "categoryId",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      // This is the important part:
      field: "categoryId",
      comment: "FK to categories.categoryId",
      // Force binary collation (same as categories table)
      type: DataTypes.CHAR(36), // override the default
      collate: "utf8mb4_bin", // <-- THIS LINE FIXES IT
    },
  },
  {
    tableName: "keywords",
    timestamps: true,
  }
);

module.exports = Keyword;
