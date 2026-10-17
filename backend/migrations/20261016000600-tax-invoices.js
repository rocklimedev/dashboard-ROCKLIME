"use strict";

/**
 * GST tax invoices made in the ERP (from an order or one dispatch), numbered
 * per financial year (CM/26-27/0001). Safe to run more than once.
 */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require("sequelize");
    const { DataTypes } = Sequelize;
    const tables = (await queryInterface.showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName));
    const now = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };
    if (!tables.includes("tax_invoices")) {
      await queryInterface.createTable("tax_invoices", {
        id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
        invoiceNo: { type: DataTypes.STRING(16), allowNull: false, unique: true },
        financialYear: { type: DataTypes.STRING(5), allowNull: false },
        invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
        orderId: { type: DataTypes.CHAR(36), allowNull: false },
        orderNo: { type: DataTypes.STRING(64) },
        dispatchId: { type: DataTypes.CHAR(36), allowNull: true },
        customerId: { type: DataTypes.CHAR(36), allowNull: true },
        customerName: { type: DataTypes.STRING(255) },
        customerGstin: { type: DataTypes.STRING(15) },
        billTo: { type: DataTypes.JSON },
        shipTo: { type: DataTypes.JSON },
        placeOfSupply: { type: DataTypes.STRING(60) },
        interState: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        lines: { type: DataTypes.JSON, allowNull: false },
        goodsValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        freight: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        discount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        taxableValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        gstRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
        cgst: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        sgst: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        igst: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        roundOff: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
        total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        ewayBillNo: { type: DataTypes.STRING(20) },
        vehicleNo: { type: DataTypes.STRING(20) },
        irn: { type: DataTypes.STRING(64) },
        status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: "ISSUED" },
        cancelReason: { type: DataTypes.TEXT },
        cancelledAt: { type: DataTypes.DATE },
        createdBy: { type: DataTypes.CHAR(36) },
        createdAt: now,
        updatedAt: now,
      });
      await queryInterface.addIndex("tax_invoices", ["orderId"]);
      await queryInterface.addIndex("tax_invoices", ["customerId"]);
      await queryInterface.addIndex("tax_invoices", ["invoiceDate"]);
      await queryInterface.addIndex("tax_invoices", ["dispatchId"]);
    }
    if (!tables.includes("invoice_counters")) {
      await queryInterface.createTable("invoice_counters", {
        financialYear: { type: DataTypes.STRING(5), primaryKey: true, allowNull: false },
        last: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      });
    }
  },
};
