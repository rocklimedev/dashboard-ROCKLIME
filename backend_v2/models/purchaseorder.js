const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, DataTypes) => {
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
          model: "vendors", // IMPORTANT → use table name, not model import
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
        comment: "Array of { productId, quantity, unitPrice }",
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

  // ASSOCIATIONS WILL BE ADDED IN setupAssociations()
  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
    });
  };

  return PurchaseOrder;
};
