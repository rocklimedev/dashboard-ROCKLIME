// models/InventoryHistory.js
const { v7: uuidv7 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
  const InventoryHistory = sequelize.define(
    "InventoryHistory",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        comment: "UUID v7 – time-ordered, distributed-safe, sortable by time",
      },
      productId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        comment: "Reference to Product.id (UUID)",
      },
      change: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Positive = stock added, Negative = stock removed",
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
          "correction",
        ),
        allowNull: false,
      },
      orderNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Optional reference to order number",
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: true,
        comment: "Optional reference to User.id (UUID)",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Human-readable description of the stock change",
      },
    },
    {
      tableName: "inventory_history",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      paranoid: false, // soft deletes not needed for history

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
        // This runs BEFORE validation → prevents notNull violation
        beforeValidate: (instance) => {
          if (!instance.id) {
            instance.id = uuidv7();
          }
        },

        // Handle bulk creation safely
        beforeBulkCreate: (instances) => {
          instances.forEach((instance) => {
            if (!instance.id) {
              instance.id = uuidv7();
            }
          });
        },

        // Optional: you can keep beforeCreate for other logic if needed later
        // beforeCreate: (instance) => { ... }
      },
    },
  );

  // Optional: associations (add if you use them elsewhere)
  InventoryHistory.associate = (models) => {
    InventoryHistory.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });

    InventoryHistory.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      constraints: false, // allow null userId
    });
  };

  return InventoryHistory;
};
