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
      unique: true, // Ensure no duplicate keywords
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "categories", // Must match the actual table name of the Category model
        key: "categoryId",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // Optional: Deletes keyword if category is deleted
    },
  },
  {
    tableName: "keywords",
    timestamps: true,
  }
);

module.exports = Keyword;
