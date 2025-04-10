"use strict";

const crypto = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [invoices] = await queryInterface.sequelize.query(`
      SELECT invoiceId FROM invoices WHERE invoiceNo IS NULL OR invoiceNo = ''
    `);

    const usedNumbers = new Set();

    for (const invoice of invoices) {
      let unique = false;
      let invoiceNo = "";
      const datePart = new Date().toISOString().split("T")[0].replace(/-/g, ""); // e.g., 20250410

      while (!unique) {
        const randomPart = crypto.randomInt(100000, 999999);
        invoiceNo = `INV_${datePart}_${randomPart}`;

        if (!usedNumbers.has(invoiceNo)) {
          const [existing] = await queryInterface.sequelize.query(`
            SELECT invoiceId FROM invoices WHERE invoiceNo = '${invoiceNo}'
          `);

          if (existing.length === 0) {
            usedNumbers.add(invoiceNo);
            unique = true;
          }
        }
      }

      await queryInterface.sequelize.query(`
        UPDATE invoices SET invoiceNo = '${invoiceNo}' WHERE invoiceId = '${invoice.invoiceId}'
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Optional rollback: clear all generated invoiceNo fields
    await queryInterface.sequelize.query(`
      UPDATE invoices SET invoiceNo = NULL
    `);
  },
};
