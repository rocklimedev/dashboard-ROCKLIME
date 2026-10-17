const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "OrderPayment",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: () => uuidv4() },
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
    },
    { tableName: "order_payments", timestamps: true },
  );
