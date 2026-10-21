// First, updates to existing models

// models/PurchaseOrder.js (updated)
// Add fgsId to link back to originating FGS (if any)
// Add more enum statuses: "partial_delivered", "in_negotiation" (assuming based on context; can adjust)
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      poNumber: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        // ← NEW
        type: DataTypes.UUID,
        allowNull: true,
      },
      fgsId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'in_negotiation',
          'confirmed',
          'partial_delivered',
          'delivered',
          'cancelled',
        ),
        defaultValue: 'pending',
      },
      orderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      expectDeliveryDate: DataTypes.DATE,
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      // full PO (migration 20261017000200)
      warehouseId: { type: DataTypes.CHAR(36), allowNull: true },
      vendorRef: { type: DataTypes.STRING(80), allowNull: true },
      paymentTerms: { type: DataTypes.STRING(255), allowNull: true },
      deliveryTerms: { type: DataTypes.STRING(255), allowNull: true },
      freight: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
      subTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      discountTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      taxableValue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      gstAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      interState: { type: DataTypes.BOOLEAN, defaultValue: false },
      roundOff: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
      mongoItemsId: {
        type: DataTypes.STRING(24),
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: 'purchase_orders',
      timestamps: true,
    },
  );

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Vendor, {
      foreignKey: 'vendorId',
      as: 'vendor',
    });

    PurchaseOrder.belongsTo(models.FieldGuidedSheet, {
      foreignKey: 'fgsId',
      as: 'fgs',
    });

    PurchaseOrder.belongsTo(models.User, {
      foreignKey: 'userId', // source key (in PurchaseOrder)
      targetKey: 'userId', // ← ADD THIS: target key in User model
      as: 'createdBy',
    });
  };

  return PurchaseOrder;
};
