// models/InventoryHistory.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Product = require("./product");

const InventoryHistory = sequelize.define(
  "InventoryHistory",
  {
    id: {
      type: DataTypes.CHAR(36), // ← UUID v7 as string
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4, // ← temporary fallback
      comment: "UUID v7 - time-ordered & distributed-safe",
    },
    productId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: Product,
        key: "productId", // ← THIS WAS THE BUG ALL ALONG
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    change: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Positive = add stock, Negative = remove/sale",
    },
    quantityAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Snapshot of product.quantity AFTER this change",
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
      { name: "idx_created_at", fields: ["createdAt"] },
      { name: "idx_action", fields: ["action"] },
      { name: "idx_user", fields: ["userId"] },
    ],
    hooks: {
      beforeCreate: (record) => {
        // AUTO-GENERATE REAL UUID v7 IN CODE (overrides defaultValue)
        const { v7: uuidv7 } = require("uuid");
        record.id = uuidv7();
      },
    },
  }
);

// Relationships
Product.hasMany(InventoryHistory, {
  foreignKey: "productId",
  as: "inventoryHistory",
  onDelete: "CASCADE",
});

InventoryHistory.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

module.exports = InventoryHistory;
