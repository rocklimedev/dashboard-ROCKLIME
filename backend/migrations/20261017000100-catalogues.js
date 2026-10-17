"use strict";

/** Brand PDF catalogues and their page text (for search). Safe to run again. */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require("sequelize");
    const { DataTypes } = Sequelize;
    const tables = (await queryInterface.showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName));
    if (!tables.includes("catalogues")) {
      await queryInterface.createTable("catalogues", {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        title: { type: DataTypes.STRING(200), allowNull: false },
        brandId: { type: DataTypes.CHAR(36), allowNull: true },
        brandName: { type: DataTypes.STRING(120), allowNull: true },
        category: { type: DataTypes.STRING(120), allowNull: true },
        year: { type: DataTypes.STRING(20), allowNull: true },
        fileName: { type: DataTypes.STRING(255), allowNull: false },
        storedName: { type: DataTypes.STRING(80), allowNull: false },
        coverName: { type: DataTypes.STRING(80), allowNull: true },
        sizeBytes: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        pages: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        textIndexed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        uploadedBy: { type: DataTypes.CHAR(36), allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      });
      await queryInterface.addIndex("catalogues", ["brandId"]);
    }
    if (!tables.includes("catalogue_pages")) {
      await queryInterface.createTable("catalogue_pages", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        catalogueId: { type: DataTypes.CHAR(36), allowNull: false },
        page: { type: DataTypes.INTEGER, allowNull: false },
        text: { type: DataTypes.TEXT("medium"), allowNull: true },
      });
      await queryInterface.addIndex("catalogue_pages", ["catalogueId", "page"], { unique: true });
    }
  },
  async down(queryInterface) {
    await queryInterface.dropTable("catalogue_pages").catch(() => {});
    await queryInterface.dropTable("catalogues").catch(() => {});
  },
};
