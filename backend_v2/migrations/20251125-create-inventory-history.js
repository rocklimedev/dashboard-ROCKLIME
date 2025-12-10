// migrations/20251125-create-inventory-history.js
"use strict";

module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable("inventory_history", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      change: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantityAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
        type: DataTypes.UUID,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });

    await queryInterface.addIndex("inventory_history", ["productId"], {
      name: "idx_product_id",
    });
    await queryInterface.addIndex("inventory_history", ["createdAt"], {
      name: "idx_created_at",
    });
    await queryInterface.addIndex(
      "inventory_history",
      ["productId", "createdAt"],
      {
        name: "idx_product_created",
        order: "DESC",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inventory_history");
  },
};
