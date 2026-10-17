"use strict";

/**
 * Payments received against orders (Accounts app).
 * Existing "amount paid" figures on orders become one opening payment each,
 * so the order's paid amount is always the sum of its payments.
 * Safe to run more than once.
 */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require("sequelize");
    const { DataTypes } = Sequelize;
    const tables = (await queryInterface.showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName));
    if (!tables.includes("order_payments")) {
      await queryInterface.createTable("order_payments", {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        receiptNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
        orderId: { type: DataTypes.CHAR(36), allowNull: false },
        orderNo: { type: DataTypes.STRING(64) },
        customerId: { type: DataTypes.CHAR(36) },
        amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
        mode: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "UPI" },
        reference: { type: DataTypes.STRING(120) },
        receivedAt: { type: DataTypes.DATE, allowNull: false },
        notes: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: "RECEIVED" },
        cancelReason: { type: DataTypes.TEXT },
        userId: { type: DataTypes.CHAR(36) },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      });
      await queryInterface.addIndex("order_payments", ["orderId"]);
      await queryInterface.addIndex("order_payments", ["customerId"]);
      await queryInterface.addIndex("order_payments", ["receivedAt"]);
    }
    // Opening payments for amounts already recorded on orders
    await queryInterface.sequelize.query(`
      INSERT INTO order_payments (id, receiptNo, orderId, orderNo, customerId, amount, mode, reference, receivedAt, notes, status, createdAt, updatedAt)
      SELECT UUID(), CONCAT('OPEN-', o.orderNo), o.id, o.orderNo, o.createdFor, o.amountPaid, 'OTHER', NULL,
             COALESCE(o.createdAt, NOW()), 'Amount paid recorded on the order before payments were tracked', 'RECEIVED', NOW(), NOW()
      FROM orders o
      WHERE COALESCE(o.amountPaid, 0) > 0
        AND NOT EXISTS (SELECT 1 FROM order_payments p WHERE p.orderId = o.id)
    `);
  },
};
