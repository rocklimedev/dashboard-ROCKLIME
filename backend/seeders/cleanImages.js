"use strict";
const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch the ProductMeta ID for company_code
    const companyCodeMeta = await ProductMeta.findOne({
      where: { title: "company_code" },
      attributes: ["id"],
    });

    if (!companyCodeMeta) {
      console.log(
        'No ProductMeta found for title "company_code". Aborting seeder.'
      );
      return;
    }

    const companyCodeMetaId = companyCodeMeta.id;
    console.log(`Found company_code ProductMeta ID: ${companyCodeMetaId}`);

    // Fetch products with empty images (handle multiple cases)
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { images: "[]" },
          { images: "" },
          { images: null },
          { images: { [Op.eq]: [] } }, // For JSON/JSONB columns
        ],
      },
      attributes: ["productId", "images", "meta"],
    });

    console.log(`Fetched ${products.length} products with empty images`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Iterate through each product
    for (const product of products) {
      try {
        // Log the raw images value for debugging
        console.log(
          `Processing product ${product.productId}, images: ${product.images}`
        );

        // Parse the images field
        let images;
        try {
          images = product.images ? JSON.parse(product.images) : [];
        } catch (error) {
          console.log(
            `Invalid images JSON for product ${product.productId}: ${product.images}`
          );
          skippedCount++;
          continue;
        }

        // Skip if images is not empty
        if (Array.isArray(images) && images.length > 0) {
          console.log(
            `Skipping product ${product.productId}: images not empty (${product.images})`
          );
          skippedCount++;
          continue;
        }

        // Parse the meta field
        const meta = product.meta || {};
        const companyCode = meta[companyCodeMetaId];

        if (!companyCode) {
          console.log(
            `No company_code found in meta for product ${product.productId}`
          );
          skippedCount++;
          continue;
        }

        // Construct the image URL using company_code
        const imageUrl = `https://static.cmtradingco.com/product_images/${companyCode}.png`;

        // Update the images field
        await Product.update(
          { images: JSON.stringify([imageUrl]) },
          { where: { productId: product.productId } }
        );

        console.log(
          `Updated product ${product.productId} with image ${imageUrl}`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `Failed to update product ${product.productId}: ${error.message}`
        );
        skippedCount++;
      }
    }

    console.log(
      `Seeder completed: ${updatedCount} products updated, ${skippedCount} products skipped.`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes by setting images back to "[]"
    await Product.update(
      { images: "[]" },
      { where: { images: { [Op.like]: "%static.cmtradingco.com%" } } }
    );
    console.log("Reverted image updates for all affected products");
  },
};
