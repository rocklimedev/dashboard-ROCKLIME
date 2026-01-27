"use strict";

const { v7: uuidv7 } = require("uuid");

const updateData = require("./db-ready-payload.json");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log(
        "Starting stock correction migration (2025-01-19 sanitary backup adjustment)",
      );

      // 1. Update product quantities
      for (const p of updateData.products_to_update) {
        const updatedCount = await queryInterface.bulkUpdate(
          "products",
          {
            quantity: p.quantity,
            updatedAt: Sequelize.fn("NOW"),
          },
          { productId: p.productId },
          { transaction },
        );

        if (updatedCount === 0) {
          console.warn(`⚠️ Product not found or not updated: ${p.productId}`);
        } else {
          console.log(`✓ Updated quantity → ${p.quantity}  for ${p.productId}`);
        }
      }

      // 2. Insert inventory history records
      const historyRecords = updateData.inventory_history_to_insert.map(
        (h) => ({
          id: uuidv7(),
          productId: h.productId,
          change: h.change,
          quantityAfter: h.quantityAfter,
          action: h.action,
          message: h.message,
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
          // orderNo: null,     // ← add if you want to fill it
          // userId: null,      // ← add if known
        }),
      );

      if (historyRecords.length > 0) {
        await queryInterface.bulkInsert("inventory_history", historyRecords, {
          transaction,
        });
        console.log(
          `✓ Inserted ${historyRecords.length} inventory history records`,
        );
      }

      await transaction.commit();
      console.log("✅ Stock correction migration completed successfully");
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Migration failed:", err);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This down migration is intentionally limited / destructive
    // In production you would usually NOT rollback corrections like this
    // But for safety during testing you can rollback the quantity changes
    // (inventory_history is append-only → usually not reverted)

    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.warn(
        "⚠️ Rolling back stock quantities (inventory_history is NOT deleted)",
      );

      for (const p of updateData.products_to_update) {
        // You would need to know the PREVIOUS quantity to restore it properly
        // Since we don't have it here → this is just a placeholder warning
        console.warn(
          `Cannot safely restore original quantity for ${p.productId}`,
        );
        // If you have a known previous value, you can do:
        // await queryInterface.bulkUpdate("products", { quantity: OLD_VALUE, ... }, { productId: p.productId }, { transaction });
      }

      // Most real-world cases → do NOT delete history entries
      // await queryInterface.bulkDelete("inventory_history", {
      //   productId: { [Sequelize.Op.in]: updateData.products_to_update.map(p => p.productId) },
      //   action: "correction",
      //   message: { [Sequelize.Op.like]: "%19.01.2026 Stock SANITARY%" }
      // }, { transaction });

      await transaction.commit();
      console.log("Rollback finished (partial – history preserved)");
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
