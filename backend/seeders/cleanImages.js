"use strict";
const Product = require("../models/product");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch all products in Chemicals & Adhesive parentcategory
    const products = await Product.findAll({
      where: {
        brand_parentcategoriesId: "94b8daf8-d026-4983-a567-85381c8faded",
      },
      attributes: ["productId", "name", "images"],
    });

    console.log(`Fetched ${products.length} products to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      try {
        const name = product.name;

        if (!name) {
          console.log(`❌ No name for product ${product.productId}`);
          skippedCount++;
          continue;
        }

        // Clean name: allow alphanumeric + spaces, drop everything else
        const cleanName = name
          .replace(/[^\w\s]/g, "") // remove special chars
          .replace(/\s+/g, " ") // collapse multiple spaces
          .trim();

        if (!cleanName) {
          console.log(`❌ Cleaned name empty for product ${product.productId}`);
          skippedCount++;
          continue;
        }

        // Encode to make it safe for URL (spaces → %20, etc.)
        const encodedName = encodeURIComponent(cleanName);

        // Build new image URL
        const newImageUrl = `https://static.cmtradingco.com/product_images/${encodedName}.png`;

        // Skip update if image already matches
        const currentImages = product.images ? JSON.parse(product.images) : [];
        if (currentImages.length && currentImages[0] === newImageUrl) {
          console.log(`⏩ Skipping ${product.productId} (already up to date)`);
          skippedCount++;
          continue;
        }

        // Update DB
        await Product.update(
          { images: JSON.stringify([newImageUrl]) },
          { where: { productId: product.productId } }
        );

        console.log(`✅ Updated ${product.productId} -> ${newImageUrl}`);
        updatedCount++;
      } catch (error) {
        console.error(
          `⚠️ Failed to update ${product.productId}: ${error.message}`
        );
        skippedCount++;
      }
    }

    console.log(
      `Seeder finished: ✅ ${updatedCount} updated, ⏩ ${skippedCount} skipped.`
    );
  },

  down: async (queryInterface, Sequelize) => {
    console.log("Revert not implemented. Restore from backup if needed.");
  },
};
