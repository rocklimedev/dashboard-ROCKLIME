// models/OrderCreditNote.js

module.exports = (sequelize, DataTypes) => {
  const OrderCreditNote = sequelize.define(
    "OrderCreditNote",
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

      orderNo: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      creditNoteNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      creditNoteLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      creditNoteDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      totalQuantity: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },

      totalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("DRAFT", "ISSUED", "RECEIVED", "CANCELED"),
        allowNull: false,
        defaultValue: "ISSUED",
      },

      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "order_credit_notes",
      timestamps: true,
      indexes: [
        { fields: ["orderId"] },
        { fields: ["orderNo"] },
        { fields: ["creditNoteNumber"] },
        { fields: ["status"] },
        { fields: ["creditNoteDate"] },
      ],
    },
  );

  OrderCreditNote.associate = (models) => {
    OrderCreditNote.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });

    OrderCreditNote.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });

    OrderCreditNote.hasMany(models.OrderCreditNoteItem, {
      foreignKey: "creditNoteId",
      as: "items",
    });
  };

  return OrderCreditNote;
};
