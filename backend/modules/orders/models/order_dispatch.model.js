// models/OrderDispatch.js
// Stores one row PER DISPATCH EVENT so an order can be shipped in multiple
// partial batches. Order.status reflects the aggregate (DISPATCHED vs
// PARTIALLY_DISPATCHED) based on what's been recorded here.
module.exports = (sequelize, DataTypes) => {
  const OrderDispatch = sequelize.define(
    "OrderDispatch",
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

      // 1, 2, 3... sequential per order (Dispatch #1, #2, etc.)
      dispatchNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // [{ productId, name, productCode, quantity, price, total }]
      items: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      totalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      dispatchDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      carrier: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      trackingNumber: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      // [3-4 lines above gatePassLink, same style]
      invoiceLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      // Gate-pass specific to THIS dispatch batch (a partial shipment may
      // need its own gate-pass). The order's top-level gatePassLink is kept
      // in sync with the most recent one for backward compatibility.
      gatePassLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      dispatchedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("DISPATCHED", "DELIVERED", "RETURNED"),
        allowNull: false,
        defaultValue: "DISPATCHED",
      },
    },
    {
      tableName: "order_dispatches",
      timestamps: true,
      indexes: [
        { fields: ["orderId"] },
        { fields: ["orderNo"] },
        { fields: ["dispatchDate"] },
        {
          unique: true,
          fields: ["orderId", "dispatchNumber"],
          name: "uniq_order_dispatch_number",
        },
      ],
    },
  );

  OrderDispatch.associate = (models) => {
    OrderDispatch.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });

    OrderDispatch.belongsTo(models.User, {
      foreignKey: "dispatchedBy",
      as: "dispatcher",
    });
  };

  return OrderDispatch;
};
