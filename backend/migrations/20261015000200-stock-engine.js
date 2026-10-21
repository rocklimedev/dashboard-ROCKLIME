'use strict';

/**
 * Stock engine tables.
 *
 *  warehouses          godowns
 *  stock_balances      on hand / reserved / incoming / damaged per product x godown
 *  stock_ledger        one append-only line per stock movement
 *  stock_reservations  stock held for a confirmed order (per order x product x godown)
 *  goods_receipts(+_items)  goods received against a purchase order (part quantities)
 *  stock_counts(+_lines)    physical stock counts and their approved differences
 *
 * The opening balances are created by local-tools/stock-opening.js (or the
 * same logic at go-live), not here, so the migration itself is data-safe.
 */
module.exports = {
  async up(queryInterface) {
    const Sequelize = require('sequelize');
    const { DataTypes } = Sequelize;
    const id = { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false };
    const ts = {
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    };
    const qty = { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 };

    await queryInterface.createTable('warehouses', {
      id,
      code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: true },
      isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...ts,
    });

    await queryInterface.createTable('stock_balances', {
      id,
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      onHand: qty,
      reserved: qty,
      incoming: qty,
      damaged: qty,
      ...ts,
    });
    await queryInterface.addIndex('stock_balances', ['productId', 'warehouseId'], {
      unique: true,
      name: 'uq_stock_balance_product_wh',
    });

    await queryInterface.createTable('stock_ledger', {
      id,
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      movement: { type: DataTypes.STRING(30), allowNull: false },
      onHandChange: qty,
      reservedChange: qty,
      incomingChange: qty,
      damagedChange: qty,
      onHandAfter: qty,
      reservedAfter: qty,
      incomingAfter: qty,
      damagedAfter: qty,
      refType: { type: DataTypes.STRING(30), allowNull: true },
      refId: { type: DataTypes.STRING(64), allowNull: true },
      refNo: { type: DataTypes.STRING(64), allowNull: true },
      userId: { type: DataTypes.CHAR(36), allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
      idempotencyKey: { type: DataTypes.STRING(160), allowNull: true, unique: true },
      createdAt: ts.createdAt,
    });
    await queryInterface.addIndex('stock_ledger', ['productId', 'createdAt'], {
      name: 'ix_stock_ledger_product',
    });
    await queryInterface.addIndex('stock_ledger', ['refType', 'refId'], {
      name: 'ix_stock_ledger_ref',
    });

    await queryInterface.createTable('stock_reservations', {
      id,
      orderId: { type: DataTypes.CHAR(36), allowNull: false },
      orderNo: { type: DataTypes.STRING(64), allowNull: true },
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      quantity: qty,
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      ...ts,
    });
    await queryInterface.addIndex('stock_reservations', ['orderId', 'productId', 'warehouseId'], {
      unique: true,
      name: 'uq_reservation_order_product_wh',
    });
    await queryInterface.addIndex('stock_reservations', ['productId', 'status'], {
      name: 'ix_reservation_product',
    });

    await queryInterface.createTable('goods_receipts', {
      id,
      grnNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      poId: { type: DataTypes.CHAR(36), allowNull: true },
      poNumber: { type: DataTypes.STRING(64), allowNull: true },
      vendorId: { type: DataTypes.CHAR(36), allowNull: true },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      userId: { type: DataTypes.CHAR(36), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      ...ts,
    });
    await queryInterface.createTable('goods_receipt_items', {
      id,
      grnId: { type: DataTypes.CHAR(36), allowNull: false },
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      productName: { type: DataTypes.STRING(255), allowNull: true },
      quantity: qty,
      damaged: qty,
      ...ts,
    });
    await queryInterface.addIndex('goods_receipt_items', ['grnId'], { name: 'ix_grn_items_grn' });

    await queryInterface.createTable('stock_counts', {
      id,
      countNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'DRAFT' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.CHAR(36), allowNull: true },
      approvedBy: { type: DataTypes.CHAR(36), allowNull: true },
      approvedAt: { type: DataTypes.DATE, allowNull: true },
      ...ts,
    });
    await queryInterface.createTable('stock_count_lines', {
      id,
      countId: { type: DataTypes.CHAR(36), allowNull: false },
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      systemQty: qty,
      countedQty: { type: DataTypes.INTEGER, allowNull: true },
      ...ts,
    });
    await queryInterface.addIndex('stock_count_lines', ['countId', 'productId'], {
      unique: true,
      name: 'uq_count_line',
    });

    // One default godown so everything works on day one
    await queryInterface.sequelize.query(
      "INSERT INTO warehouses (id, code, name, isDefault, active, createdAt, updatedAt) VALUES (UUID(), 'MAIN', 'Main godown', 1, 1, NOW(), NOW())",
    );
  },

  async down(queryInterface) {
    for (const t of [
      'stock_count_lines',
      'stock_counts',
      'goods_receipt_items',
      'goods_receipts',
      'stock_reservations',
      'stock_ledger',
      'stock_balances',
      'warehouses',
    ]) {
      await queryInterface.dropTable(t);
    }
  },
};
