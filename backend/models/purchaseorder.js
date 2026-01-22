// First, updates to existing models

// models/PurchaseOrder.js (updated)
// Add fgsId to link back to originating FGS (if any)
// Add more enum statuses: "partial_delivered", "in_negotiation" (assuming based on context; can adjust)
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
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
      fgsId: {  // ← NEW: Link to originating FGS (optional)
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "in_negotiation",  // ← NEW
          "confirmed",
          "partial_delivered",  // ← NEW (for limited deliveries)
          "delivered",
          "cancelled"
        ),
        defaultValue: "pending",
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
      mongoItemsId: {
        type: DataTypes.STRING(24),
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "purchase_orders",
      timestamps: true,
    },
  );

  // ─── Define association here ───
  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
      as: "vendor", // ← recommended: use alias
      targetKey: "id",
    });
    PurchaseOrder.belongsTo(models.FieldGuidedSheet, {  // ← NEW association
      foreignKey: "fgsId",
      as: "fgs",
      targetKey: "id",
    });
  };

  return PurchaseOrder;
};
