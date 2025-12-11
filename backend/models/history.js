// models/InventoryHistory.js
const { v7: uuidv7 } = require("uuid"); // Only imported when needed

module.exports = (sequelize, DataTypes) => {
  const InventoryHistory = sequelize.define(
    "InventoryHistory",
    {
      id: {
        type: DataTypes.CHAR(36), // UUID as string (supports v4 & v7)
        primaryKey: true,
        allowNull: false,
        comment: "UUID v7 - time-ordered, distributed-safe, sortable by time",
      },
      productId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },
      change: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Positive = stock in, Negative = stock out",
      },
      quantityAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Stock quantity AFTER this transaction",
      },
      action: {
        type: DataTypes.ENUM(
          "add-stock",
          "remove-stock",
          "sale",
          "return",
          "adjustment",
          "correction"
        ),
        allowNull: false,
      },
      orderNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "inventory_history",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      paranoid: false,
      indexes: [
        {
          name: "idx_product_created",
          fields: ["productId", { attribute: "createdAt", order: "DESC" }],
        },
        {
          name: "idx_created_at",
          fields: ["createdAt"],
        },
        {
          name: "idx_action",
          fields: ["action"],
        },
        {
          name: "idx_user",
          fields: ["userId"],
        },
        {
          name: "idx_order_no",
          fields: ["orderNo"],
        },
      ],
      hooks: {
        beforeCreate: (record) => {
          if (!record.id) {
            record.id = uuidv7(); // Real time-ordered UUID v7
          }
        },
        beforeBulkCreate: (records) => {
          records.forEach((record) => {
            if (!record.id) {
              record.id = uuidv7();
            }
          });
        },
      },
    }
  );

  return InventoryHistory;
};
