// models/PurchaseOrder.js
// models/PurchaseOrder.js
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
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "delivered", "cancelled"),
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
  };

  return PurchaseOrder;
};
