"use strict";

const { v4: uuidv4 } = require("uuid");
const BrandParentCategory = require("../models/brandParentCategory");
const Product = require("../models/product");
const jsonData = require("./products_backup.json"); // your JSON backup

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("🚀 Starting Product Seeder...");

      for (const item of jsonData) {
        // --- VALIDATION ---
        if (!item.productId) {
          console.warn(
            `⚠️ Skipping product with missing productId: ${
              item.name || "Unnamed Product"
            }`
          );
          continue;
        }
        if (!item.product_code) {
          console.warn(
            `⚠️ Skipping product with missing product_code: ${
              item.name || "Unnamed Product"
            }`
          );
          continue;
        }

        // --- ENSURE PARENT CATEGORY ---
        let parentCategory = null;
        if (item.brand_parentcategoriesId) {
          parentCategory = await BrandParentCategory.findOne({
            where: { id: item.brand_parentcategoriesId },
            transaction,
          });

          if (!parentCategory) {
            console.warn(
              `⚠️ Parent category not found for ${item.name} (${item.product_code}). Skipping category creation to maintain data integrity.`
            );
          }
        }

        // --- SAFE JSON PARSING ---
        const parsedImages = (() => {
          try {
            if (Array.isArray(item.images)) return JSON.stringify(item.images);
            if (typeof item.images === "string") return item.images;
            return JSON.stringify([]);
          } catch {
            return JSON.stringify([]);
          }
        })();

        const parsedMeta = (() => {
          try {
            return typeof item.meta === "object" && item.meta !== null
              ? item.meta
              : {};
          } catch {
            return {};
          }
        })();

        // --- PRODUCT DATA ---
        const productData = {
          productId: item.productId || uuidv4(),
          name: item.name || "Unnamed Product",
          product_code: String(item.product_code),
          quantity: item.quantity ?? 0,
          discountType: item.discountType || null,
          alert_quantity: item.alert_quantity ?? 0,
          tax: item.tax || null,
          description: item.description || item.name || "No description",
          images: parsedImages,
          isFeatured: !!item.isFeatured,
          userId: item.userId || null,
          productType: item.productType || "tiles",
          brandId: item.brandId || null,
          categoryId: item.categoryId || null,
          vendorId: item.vendorId || null,
          brand_parentcategoriesId: item.brand_parentcategoriesId || null,
          meta: parsedMeta,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: new Date(),
        };

        // --- UPSERT LOGIC ---
        const existingProduct = await Product.findOne({
          where: { productId: productData.productId },
          transaction,
        });

        if (existingProduct) {
          await existingProduct.update(productData, { transaction });
          console.log(
            `🔄 Updated: ${productData.name} (${productData.product_code})`
          );
        } else {
          await Product.create(productData, { transaction });
          console.log(
            `✨ Created: ${productData.name} (${productData.product_code})`
          );
        }
      }

      await transaction.commit();
      console.log("✅ Products seeded/updated successfully!");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error seeding products:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const productIds = jsonData.map((item) => item.productId).filter(Boolean);
      await queryInterface.bulkDelete(
        "products",
        { productId: productIds },
        {}
      );
      console.log("🧹 Seeded products removed successfully!");
    } catch (error) {
      console.error("❌ Error removing seeded products:", error);
      throw error;
    }
  },
};
