const { v4: uuidv4 } = require('uuid');

// A GST tax invoice made in the ERP. Lines and amounts are a frozen snapshot:
// later changes to the order or prices never change an issued invoice.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'TaxInvoice',
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: () => uuidv4() },
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
      status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'ISSUED' },
      cancelReason: { type: DataTypes.TEXT },
      cancelledAt: { type: DataTypes.DATE },
      createdBy: { type: DataTypes.CHAR(36) },
    },
    { tableName: 'tax_invoices', timestamps: true },
  );
