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
    },
  },
  {
    tableName: "keywords",
    timestamps: true,
  }
);

module.exports = Keyword;
