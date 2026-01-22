
// ─────────────────────────────────────────────────────────────
// NEW Model: models/FieldGuidedSheet.js
// Similar to PurchaseOrder, but for temporary/draft/negotiable sheets
// ─────────────────────────────────────────────────────────────
module.exports = (sequelize, DataTypes) => {
  const FieldGuidedSheet = sequelize.define(
    "FieldGuidedSheet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fgsNumber: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("draft", "negotiating", "approved", "converted", "cancelled"),
        defaultValue: "draft",
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
      tableName: "field_guided_sheets",
      timestamps: true,
    },
  );

  FieldGuidedSheet.associate = (models) => {
    FieldGuidedSheet.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
      as: "vendor",
      targetKey: "id",
    });
    FieldGuidedSheet.hasOne(models.PurchaseOrder, {  // ← Optional: for linking converted PO
      foreignKey: "fgsId",
      as: "purchaseOrder",
    });
  };

  return FieldGuidedSheet;
};
