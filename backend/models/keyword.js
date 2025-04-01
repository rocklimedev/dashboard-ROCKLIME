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
    type: {
      type: DataTypes.ENUM("Ceramics", "Sanitary"),
      allowNull: false,
    },
  },
  {
    tableName: "keywords", // Force lowercase table name
    timestamps: true,
  }
);

module.exports = Keyword;
