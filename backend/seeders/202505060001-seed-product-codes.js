"use strict";

const Product = require("../models/product");
const fs = require("fs").promises;
const path = require("path");
const sequelize = require("../config/database");

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      // Fetch all products
      console.log("Fetching products...");
      const products = await Product.findAll({
        attributes: ["productId", "name", "product_code"],
        order: [["name", "ASC"]],
        transaction,
      });

      if (!products.length) {
        console.log("No products found in the database.");
        await transaction.commit();
        return;
      }
      console.log(`Found ${products.length} products`);

      // Extract unique prefixes from existing product_codes
      const prefixCounts = {};
      const usedCodes = new Set();
      products.forEach((product) => {
        const code = product.product_code;
        if (code && code.match(/^E[A-Z]{1,3}\d{4}$/)) {
          const prefix = code.match(/^E[A-Z]{1,3}/)[0];
          prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
          usedCodes.add(code);
        } else {
          console.log(
            `Invalid product_code for product ${product.productId}: ${code}`
          );
        }
      });

      // Sort prefixes alphabetically
      const prefixes = Object.keys(prefixCounts).sort();
      const defaultPrefix = "E";
      console.log("Prefixes found:", prefixes);

      // Initialize JSON output
      const jsonOutput = {};
      prefixes.forEach((prefix) => {
        jsonOutput[prefix] = [];
      });
      jsonOutput[defaultPrefix] = [];

      // Track updates
      const updates = [];
      let defaultCounter = 1;

      // Process each product
      console.log("Processing products...");
      for (const product of products) {
        let productCode = product.product_code;
        let prefix = defaultPrefix;

        if (productCode && productCode.match(/^E[A-Z]{1,3}\d{4}$/)) {
          prefix = productCode.match(/^E[A-Z]{1,3}/)[0];
        } else {
          // Generate new product_code
          const productName = product.name ? product.name.toLowerCase() : "";
          let matchedPrefix = prefixes.find((p) =>
            products.some(
              (other) =>
                other.product_code &&
                other.product_code.startsWith(p) &&
                other.name &&
                other.name.toLowerCase().includes(productName.slice(0, 3))
            )
          );

          if (matchedPrefix) {
            prefix = matchedPrefix;
            let counter = (prefixCounts[prefix] || 0) + 1;
            do {
              const numericSuffix = counter.toString().padStart(4, "0");
              productCode = `${prefix}${numericSuffix}`;
              counter++;
            } while (usedCodes.has(productCode));
            prefixCounts[prefix] = counter;
          } else {
            do {
              const numericSuffix = defaultCounter.toString().padStart(4, "0");
              productCode = `${defaultPrefix}${numericSuffix}`;
              defaultCounter++;
            } while (usedCodes.has(productCode));
          }
          usedCodes.add(productCode);

          updates.push({
            productId: product.productId,
            product_code: productCode,
          });
        }

        if (!jsonOutput[prefix]) jsonOutput[prefix] = [];
        jsonOutput[prefix].push({
          productId: product.productId,
          product_code: productCode,
          name: product.name || "Unnamed",
        });
      }

      // Sort products within each prefix by name
      Object.keys(jsonOutput).forEach((prefix) => {
        jsonOutput[prefix].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Update product codes in the database
      console.log(`Preparing to update ${updates.length} products...`);
      for (const update of updates) {
        try {
          console.log(
            `Updating product ${update.productId} with code ${update.product_code}`
          );
          await Product.update(
            { product_code: update.product_code },
            { where: { productId: update.productId }, transaction }
          );
        } catch (err) {
          console.error(
            `Failed to update product ${update.productId}: ${err.message}`
          );
          // Continue to next update instead of failing
        }
      }

      // Write JSON file
      const outputPath = path.join(__dirname, "../product_codes.json");
      await fs.writeFile(
        outputPath,
        JSON.stringify(jsonOutput, null, 2),
        "utf-8"
      );
      console.log(`Product codes written to ${outputPath}`);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Error processing product codes:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      // Delete JSON file
      const outputPath = path.join(__dirname, "../product_codes.json");
      try {
        await fs.unlink(outputPath);
        console.log(`Deleted ${outputPath}`);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Error undoing product code processing:", error);
      throw error;
    }
  },
};
