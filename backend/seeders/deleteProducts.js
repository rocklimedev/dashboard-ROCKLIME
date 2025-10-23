/**
 * 🧹 Delete Matched Products Migration Script
 * -------------------------------------------
 * Reads `matched_products.json` and deletes all products
 * in MySQL whose productId matches.
 */

const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");
const Product = require("../models/product"); // Adjust path if needed

(async () => {
  try {
    console.log("🧠 Starting product deletion...");

    // Load matched products JSON
    const matchedFile = path.join(__dirname, "matched_products.json");

    if (!fs.existsSync(matchedFile)) {
      throw new Error(
        "❌ matched_products.json not found in current directory."
      );
    }

    const matchedProducts = JSON.parse(fs.readFileSync(matchedFile, "utf8"));
    const productIds = matchedProducts.map((p) => p.productId);

    if (productIds.length === 0) {
      console.log(
        "⚠️ No productIds found in matched_products.json — aborting."
      );
      process.exit(0);
    }

    console.log(`🗑 Found ${productIds.length} products to delete.`);

    // Start transaction
    await sequelize.transaction(async (t) => {
      const deletedCount = await Product.destroy({
        where: { productId: productIds },
        transaction: t,
      });

      console.log(`✅ Successfully deleted ${deletedCount} products.`);
    });

    await sequelize.close();
    console.log("🔒 Database connection closed.");
  } catch (err) {
    console.error("❌ Error during deletion:", err);
    await sequelize.close();
  }
})();
