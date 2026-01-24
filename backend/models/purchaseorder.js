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
          "pending",
          "in_negotiation",
          "confirmed",
          "partial_delivered",
          "delivered",
          "cancelled",
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

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });

    PurchaseOrder.belongsTo(models.FieldGuidedSheet, {
      foreignKey: "fgsId",
      as: "fgs",
    });

    PurchaseOrder.belongsTo(models.User, {
      // ← NEW
      foreignKey: "userId",
      as: "createdBy",
    });
  };

  return PurchaseOrder;
};
