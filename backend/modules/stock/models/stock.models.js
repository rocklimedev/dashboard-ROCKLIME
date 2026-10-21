// Sequelize models for the stock engine tables (see migrations/20261015000200-stock-engine.js)
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  // Fresh objects per attribute: Sequelize writes the column name into the
  // definition object, so sharing one object made every column "onHand".
  const idCol = () => ({
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  });
  const qtyCol = () => ({ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });

  const Warehouse = sequelize.define(
    'Warehouse',
    {
      id: idCol(),
      code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      address: { type: DataTypes.TEXT },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'warehouses', timestamps: true },
  );

  const StockBalance = sequelize.define(
    'StockBalance',
    {
      id: idCol(),
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      onHand: qtyCol(),
      reserved: qtyCol(),
      incoming: qtyCol(),
      damaged: qtyCol(),
      available: {
        type: DataTypes.VIRTUAL,
        get() {
          return Number(this.onHand || 0) - Number(this.reserved || 0);
        },
      },
    },
    { tableName: 'stock_balances', timestamps: true },
  );

  const StockLedger = sequelize.define(
    'StockLedger',
    {
      id: idCol(),
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      movement: { type: DataTypes.STRING(30), allowNull: false },
      onHandChange: qtyCol(),
      reservedChange: qtyCol(),
      incomingChange: qtyCol(),
      damagedChange: qtyCol(),
      onHandAfter: qtyCol(),
      reservedAfter: qtyCol(),
      incomingAfter: qtyCol(),
      damagedAfter: qtyCol(),
      refType: { type: DataTypes.STRING(30) },
      refId: { type: DataTypes.STRING(64) },
      refNo: { type: DataTypes.STRING(64) },
      userId: { type: DataTypes.CHAR(36) },
      reason: { type: DataTypes.TEXT },
      idempotencyKey: { type: DataTypes.STRING(160), unique: true },
    },
    { tableName: 'stock_ledger', timestamps: true, updatedAt: false },
  );

  const StockReservation = sequelize.define(
    'StockReservation',
    {
      id: idCol(),
      orderId: { type: DataTypes.CHAR(36), allowNull: false },
      orderNo: { type: DataTypes.STRING(64) },
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      quantity: qtyCol(),
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
    },
    { tableName: 'stock_reservations', timestamps: true },
  );

  const GoodsReceipt = sequelize.define(
    'GoodsReceipt',
    {
      id: idCol(),
      grnNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      poId: { type: DataTypes.CHAR(36) },
      poNumber: { type: DataTypes.STRING(64) },
      vendorId: { type: DataTypes.CHAR(36) },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      receivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      userId: { type: DataTypes.CHAR(36) },
      notes: { type: DataTypes.TEXT },
    },
    { tableName: 'goods_receipts', timestamps: true },
  );

  const GoodsReceiptItem = sequelize.define(
    'GoodsReceiptItem',
    {
      id: idCol(),
      grnId: { type: DataTypes.CHAR(36), allowNull: false },
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      productName: { type: DataTypes.STRING(255) },
      quantity: qtyCol(),
      damaged: qtyCol(),
    },
    { tableName: 'goods_receipt_items', timestamps: true },
  );

  const StockCount = sequelize.define(
    'StockCount',
    {
      id: idCol(),
      countNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      warehouseId: { type: DataTypes.CHAR(36), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'DRAFT' },
      notes: { type: DataTypes.TEXT },
      createdBy: { type: DataTypes.CHAR(36) },
      approvedBy: { type: DataTypes.CHAR(36) },
      approvedAt: { type: DataTypes.DATE },
    },
    { tableName: 'stock_counts', timestamps: true },
  );

  const StockCountLine = sequelize.define(
    'StockCountLine',
    {
      id: idCol(),
      countId: { type: DataTypes.CHAR(36), allowNull: false },
      productId: { type: DataTypes.CHAR(36), allowNull: false },
      systemQty: qtyCol(),
      countedQty: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'stock_count_lines', timestamps: true },
  );

  GoodsReceipt.hasMany(GoodsReceiptItem, { foreignKey: 'grnId', as: 'items' });
  GoodsReceiptItem.belongsTo(GoodsReceipt, { foreignKey: 'grnId', as: 'receipt' });
  StockCount.hasMany(StockCountLine, { foreignKey: 'countId', as: 'lines' });
  StockCountLine.belongsTo(StockCount, { foreignKey: 'countId', as: 'count' });
  StockBalance.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
  StockReservation.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
  StockLedger.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

  return {
    Warehouse,
    StockBalance,
    StockLedger,
    StockReservation,
    GoodsReceipt,
    GoodsReceiptItem,
    StockCount,
    StockCountLine,
  };
};
