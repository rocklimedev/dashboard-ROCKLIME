// models/OrderCreditNoteItem.js

module.exports = (sequelize, DataTypes) => {
  const OrderCreditNoteItem = sequelize.define(
    "OrderCreditNoteItem",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      creditNoteId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      name: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },

      price: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },

      discount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },

      discountType: {
        type: DataTypes.ENUM("percent", "fixed"),
        allowNull: false,
        defaultValue: "percent",
      },

      tax: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },

      total: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },

      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "order_credit_note_items",
      timestamps: true,
      indexes: [
        { fields: ["creditNoteId"] },
        { fields: ["orderId"] },
        { fields: ["productId"] },
      ],
    },
  );

  OrderCreditNoteItem.associate = (models) => {
    OrderCreditNoteItem.belongsTo(models.OrderCreditNote, {
      foreignKey: "creditNoteId",
      as: "creditNote",
    });

    OrderCreditNoteItem.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });

    OrderCreditNoteItem.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return OrderCreditNoteItem;
};
