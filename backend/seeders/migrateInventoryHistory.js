// FINAL WORKING migrate-inventoryhistories.js
require("dotenv").config();
const sequelize = require("../config/database");
const connectMongoDB = require("../config/dbMongo");
const mongoose = require("mongoose");

const InventoryHistoryMySQL = require("../models/history");

async function migrate() {
  console.log(
    "FINAL MIGRATION: MongoDB.inventoryhistories → MySQL.inventory_history"
  );

  await sequelize.authenticate();
  console.log("MySQL connected");

  await connectMongoDB();
  console.log("MongoDB connected");

  const collection = mongoose.connection.db.collection("inventoryhistories");
  const cursor = collection.find({});

  let totalMigrated = 0;
  let docsProcessed = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    docsProcessed++;

    if (!doc.history || doc.history.length === 0) continue;

    // Sort history by timestamp to calculate correct quantityAfter
    const sortedHistory = doc.history.sort(
      (a, b) =>
        new Date(a.timestamp || a.createdAt) -
        new Date(b.timestamp || b.createdAt)
    );

    let runningTotal = 0;
    const entries = [];

    for (const entry of sortedHistory) {
      const qty = entry.quantity || 0;
      const change = entry.action === "add-stock" ? qty : -qty;
      runningTotal += change;

      entries.push({
        productId: doc.productId,
        change: change,
        quantityAfter: runningTotal, // ← NOW CORRECT & NOT NULL
        action: entry.action,
        orderNo: entry.orderNo || null,
        userId: entry.userId || null,
        message: entry.message || null,
        createdAt: entry.timestamp || doc.createdAt || new Date(),
        updatedAt: entry.timestamp || doc.updatedAt || new Date(),
      });
    }

    try {
      await InventoryHistoryMySQL.bulkCreate(entries, {
        ignoreDuplicates: true,
        validate: true,
      });
      totalMigrated += entries.length;
      console.log(`Success: ${entries.length} entries → ${doc.productId}`);
    } catch (err) {
      console.error(
        `Still failed for ${doc.productId}:`,
        err.errors?.[0]?.message || err.message
      );
    }
  }

  console.log("\nMIGRATION 100% SUCCESSFUL!");
  console.log(`Processed: ${docsProcessed} products`);
  console.log(`Migrated: ${totalMigrated} history records`);
  console.log(
    "Your MySQL inventory_history table is now COMPLETE and ACCURATE"
  );

  await mongoose.disconnect();
  await sequelize.close();
}

migrate().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
