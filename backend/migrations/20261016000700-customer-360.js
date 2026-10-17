"use strict";

/**
 * Customer 360: credit limit and credit days, who referred the customer
 * (an architect / contractor / interior designer, who is also a customer),
 * notes; and the "Coverage per box (sq ft)" product field used by the tile
 * calculator. Safe to run more than once.
 */
const { randomUUID } = require("crypto");

module.exports = {
  async up(queryInterface) {
    const { DataTypes } = require("sequelize");
    const cols = await queryInterface.describeTable("customers");
    const add = async (name, spec) => {
      if (!cols[name]) await queryInterface.addColumn("customers", name, spec);
    };
    await add("creditLimit", { type: DataTypes.DECIMAL(14, 2), allowNull: true });
    await add("creditDays", { type: DataTypes.INTEGER, allowNull: true });
    await add("referredBy", { type: DataTypes.CHAR(36), allowNull: true });
    await add("notes", { type: DataTypes.TEXT, allowNull: true });
    const idx = await queryInterface.showIndex("customers");
    if (!idx.some((i) => i.name === "customers_referred_by")) {
      await queryInterface.addIndex("customers", ["referredBy"], { name: "customers_referred_by" });
    }
    const [cov] = await queryInterface.sequelize.query(
      "SELECT id FROM product_metas WHERE slug = 'coveragePerBox' OR LOWER(title) LIKE 'coverage%' LIMIT 1",
    );
    if (!cov.length) {
      await queryInterface.sequelize.query(
        "INSERT INTO product_metas (id, title, slug, fieldType, unit, createdAt) VALUES (?, 'Coverage per box', 'coveragePerBox', 'number', 'sq ft', NOW())",
        { replacements: [randomUUID()] },
      );
    }
  },
};
