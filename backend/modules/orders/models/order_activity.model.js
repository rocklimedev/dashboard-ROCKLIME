// models/OrderActivity.js
// Dedicated, order-scoped activity log — separate from the generic
// ActivityLog/logActivity system already used elsewhere in the app.
// Immutable: no updatedAt, entries are never edited after creation.
module.exports = (sequelize, DataTypes) => {
  const OrderActivity = sequelize.define(
    "OrderActivity",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      // Denormalized for fast display / search without a join
      orderNo: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      // e.g. ORDER_CREATED, ORDER_UPDATED, STATUS_CHANGED, DISPATCH_CREATED,
      // GATE_PASS_ISSUED, INVOICE_UPLOADED, CREDIT_NOTE_UPLOADED,
      // RECEIVING_DOCUMENT_UPLOADED, ORDER_DELETED
      action: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      oldValue: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      newValue: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      performedBy: {
        type: DataTypes.UUID,
        allowNull: true, // null = system-triggered
      },

      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      ipAddress: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
    },
    {
      tableName: "order_activity",
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ["orderId"] },
        { fields: ["orderNo"] },
        { fields: ["action"] },
        { fields: ["createdAt"] },
      ],
    },
  );

  OrderActivity.associate = (models) => {
    OrderActivity.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });

    OrderActivity.belongsTo(models.User, {
      foreignKey: "performedBy",
      as: "performedByUser",
    });
  };

  return OrderActivity;
};
