'use strict';

/**
 * Dispatch details: vehicle, driver, transporter, LR and e-way bill numbers,
 * and delivery confirmation (when, who received it, proof photo/POD).
 * Safe to run more than once.
 */
module.exports = {
  async up(queryInterface) {
    const { DataTypes } = require('sequelize');
    const cols = await queryInterface.describeTable('order_dispatches');
    const add = async (name, spec) => {
      if (!cols[name]) await queryInterface.addColumn('order_dispatches', name, spec);
    };
    await add('vehicleNo', { type: DataTypes.STRING(20), allowNull: true });
    await add('driverName', { type: DataTypes.STRING(80), allowNull: true });
    await add('driverPhone', { type: DataTypes.STRING(20), allowNull: true });
    await add('transporter', { type: DataTypes.STRING(120), allowNull: true });
    await add('lrNumber', { type: DataTypes.STRING(60), allowNull: true });
    await add('ewayBillNo', { type: DataTypes.STRING(20), allowNull: true });
    await add('deliveredAt', { type: DataTypes.DATE, allowNull: true });
    await add('receivedBy', { type: DataTypes.STRING(120), allowNull: true });
    await add('deliveryProofLink', { type: DataTypes.STRING(500), allowNull: true });
    await add('deliveryNote', { type: DataTypes.TEXT, allowNull: true });
  },
};
