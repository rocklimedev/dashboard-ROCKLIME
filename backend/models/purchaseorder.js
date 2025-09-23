const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Vendor = require("./vendor");
const { v4: uuidv4 } = require("uuid");

const PurchaseOrder = sequelize.define(
  "PurchaseOrder",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    poNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Vendor,
        key: "id", // <-- this is correct
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", // or CASCADE if you want
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expectDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Array of {productId, quantity, unitPrice}",
    },
  },
  {
    tableName: "purchase_orders",
    timestamps: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    engine: "InnoDB",
  }
);

// Correct relationship
PurchaseOrder.belongsTo(Vendor, { foreignKey: "vendorId" });

module.exports = PurchaseOrder;
