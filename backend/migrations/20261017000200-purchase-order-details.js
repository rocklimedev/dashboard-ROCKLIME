'use strict';

/**
 * Complete purchase orders: vendor contact/GST details, and on the PO the
 * godown to deliver to, vendor reference, payment and delivery terms,
 * freight, notes and the full money breakdown. Safe to run again.
 */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require('sequelize');
    const { DataTypes } = Sequelize;
    const add = async (table, cols) => {
      const have = await queryInterface.describeTable(table);
      for (const [name, def] of Object.entries(cols))
        if (!have[name]) await queryInterface.addColumn(table, name, def);
    };
    await add('vendors', {
      contactPerson: { type: DataTypes.STRING(120), allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      email: { type: DataTypes.STRING(160), allowNull: true },
      gstin: { type: DataTypes.STRING(15), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(80), allowNull: true },
      state: { type: DataTypes.STRING(60), allowNull: true },
      pincode: { type: DataTypes.STRING(10), allowNull: true },
      paymentTerms: { type: DataTypes.STRING(255), allowNull: true },
    });
    await add('purchase_orders', {
      warehouseId: { type: DataTypes.CHAR(36), allowNull: true },
      vendorRef: { type: DataTypes.STRING(80), allowNull: true },
      paymentTerms: { type: DataTypes.STRING(255), allowNull: true },
      deliveryTerms: { type: DataTypes.STRING(255), allowNull: true },
      freight: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
      subTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discountTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      taxableValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      gstAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      interState: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      roundOff: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    });
  },
  async down() {},
};
