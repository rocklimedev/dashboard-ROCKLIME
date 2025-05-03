"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Query to find products with quantity < alert_quantity
    const [results, metadata] = await queryInterface.sequelize.query(`
      SELECT COUNT(*) AS low_stock_count
      FROM products
      WHERE alert_quantity IS NOT NULL
        AND quantity < alert_quantity
    `);

    console.log(
      `\n🔔 Number of products below alert quantity: ${results[0].low_stock_count}\n`
    );
  },

  async down(queryInterface, Sequelize) {
    // This seeder is only for inspection; nothing to revert
    console.log("\nℹ️ Seeder does not modify data — nothing to revert.\n");
  },
};
