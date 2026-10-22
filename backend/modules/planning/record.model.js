const { DataTypes } = require('sequelize');
const db = require('../../config/database');
module.exports = (name, tableName) =>
  db.define(
    name,
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      ownerId: { type: DataTypes.CHAR(36), allowNull: false },
      data: { type: DataTypes.JSON, allowNull: false },
      external: { type: DataTypes.JSON },
      syncState: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'local' },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { tableName, timestamps: true, paranoid: true },
  );
