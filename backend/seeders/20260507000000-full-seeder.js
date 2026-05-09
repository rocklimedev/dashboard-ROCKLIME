"use strict";

const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

const seedData = require("./seedable-data.json");

const rawProducts = seedData.products || [];
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("🚀 Starting Full Seeder...");

      // ---------------------------------------------------
      // CONFIG
      // ---------------------------------------------------
      const BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";

      // ---------------------------------------------------
      // STORAGE
      // ---------------------------------------------------
      const categoryMap = new Map();

      const keywordMap = new Map();

      const products = [];

      const productKeywords = [];

      const relationSet = new Set();

      // ---------------------------------------------------
      // META FIELD IDS
      // ---------------------------------------------------
      const META_KEYS = [
        "1cf23921-49cd-11f1-93ac-52540021303b",
        "d11da9f9-3f2e-4536-8236-9671200cca4a",
        "81cd6d76-d7d2-4226-b48e-6704e6224c2b",
        "1cf288ba-49cd-11f1-93ac-52540021303b",
        "9ba862ef-f993-4873-95ef-1fef10036aa5",
        "1cf286a9-49cd-11f1-93ac-52540021303b",
      ];

      // ---------------------------------------------------
      // FIRST PASS → CREATE CATEGORIES
      // ---------------------------------------------------
      for (const item of rawProducts) {
        const categoryName = item.categoryId?.trim();

        if (!categoryName) continue;

        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            categoryId: uuidv4(),

            name: categoryName,

            slug: slugify(categoryName, {
              lower: true,
              strict: true,
            }),

            brandId: BRAND_ID,

            parentCategoryId: null,

            createdAt: new Date(),

            updatedAt: new Date(),
          });
        }
      }

      // ---------------------------------------------------
      // SECOND PASS → PRODUCTS + KEYWORDS
      // ---------------------------------------------------
      for (const item of rawProducts) {
        const categoryName = item.categoryId?.trim();

        const category = categoryMap.get(categoryName);

        // ---------------------------------------------------
        // PRODUCT ID
        // ---------------------------------------------------
        const productId = uuidv4();

        // ---------------------------------------------------
        // BUILD META
        // ---------------------------------------------------
        const meta = {};

        for (const key of META_KEYS) {
          if (item[key] !== undefined) {
            meta[key] = item[key];
          }
        }

        // ---------------------------------------------------
        // BUILD PRODUCT
        // ---------------------------------------------------
        const product = {
          productId,

          name: item.name || "Unnamed Product",

          product_code: String(item.product_code || uuidv4()),

          quantity: item.quantity ?? 0,

          masterProductId: item.masterProductId || null,

          isMaster: item.isMaster || false,

          variantOptions: item.variantOptions || null,

          variantKey: item.variantKey || null,

          skuSuffix: item.skuSuffix || null,

          discountType: item.discountType || null,

          alert_quantity: item.alert_quantity ?? 0,

          tax: item.tax || "0.00",

          description: item.description || item.name || null,

          images: Array.isArray(item.images)
            ? JSON.stringify(item.images)
            : JSON.stringify([]),

          isFeatured: item.isFeatured || false,

          status: item.status || "active",

          brandId: item.brandId || BRAND_ID,

          vendorId: item.vendorId || null,

          brand_parentcategoriesId: item.brand_parentcategoriesId || null,

          categoryId: category?.categoryId || null,

          meta: JSON.stringify(meta),

          createdAt: new Date(),

          updatedAt: new Date(),
        };

        products.push(product);

        // ---------------------------------------------------
        // KEYWORDS
        // ---------------------------------------------------
        if (item.keywords && category) {
          const parsedKeywords = item.keywords
            .split(",")
            .map((k) => k.trim().toLowerCase())
            .filter(Boolean);

          for (const keywordName of parsedKeywords) {
            // ---------------------------------------------------
            // CREATE KEYWORD
            // ---------------------------------------------------
            if (!keywordMap.has(keywordName)) {
              keywordMap.set(keywordName, {
                id: uuidv4(),

                keyword: keywordName,

                categoryId: category.categoryId,

                createdAt: new Date(),

                updatedAt: new Date(),
              });
            }

            const keyword = keywordMap.get(keywordName);

            // ---------------------------------------------------
            // PRODUCT KEYWORD RELATION
            // ---------------------------------------------------
            const relationKey = `${productId}-${keyword.id}`;

            if (!relationSet.has(relationKey)) {
              relationSet.add(relationKey);

              productKeywords.push({
                productId,

                keywordId: keyword.id,

                createdAt: new Date(),

                updatedAt: new Date(),
              });
            }
          }
        }
      }

      // ---------------------------------------------------
      // FINAL ARRAYS
      // ---------------------------------------------------
      const categories = [...categoryMap.values()];

      const keywords = [...keywordMap.values()];

      // ---------------------------------------------------
      // INSERT CATEGORIES
      // ---------------------------------------------------
      console.log(`📦 Seeding Categories: ${categories.length}`);

      await queryInterface.bulkInsert("categories", categories, {
        transaction,
      });

      // ---------------------------------------------------
      // INSERT KEYWORDS
      // ---------------------------------------------------
      console.log(`🏷️ Seeding Keywords: ${keywords.length}`);

      await queryInterface.bulkInsert("keywords", keywords, { transaction });

      // ---------------------------------------------------
      // INSERT PRODUCTS
      // ---------------------------------------------------
      console.log(`🛒 Seeding Products: ${products.length}`);

      await queryInterface.bulkInsert("products", products, { transaction });

      // ---------------------------------------------------
      // INSERT PRODUCT KEYWORDS
      // ---------------------------------------------------
      console.log(`🔗 Seeding Product Keywords: ${productKeywords.length}`);

      await queryInterface.bulkInsert("products_keywords", productKeywords, {
        transaction,
      });

      // ---------------------------------------------------
      // COMMIT
      // ---------------------------------------------------
      await transaction.commit();

      console.log("✅ Full Seeder Completed Successfully!");
    } catch (error) {
      await transaction.rollback();

      console.error("❌ Seeder Failed:", error);

      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("🧹 Rolling Back Seeder...");

      // ---------------------------------------------------
      // DELETE ORDER MATTERS
      // ---------------------------------------------------
      await queryInterface.bulkDelete("products_keywords", null, {
        transaction,
      });

      await queryInterface.bulkDelete("products", null, { transaction });

      await queryInterface.bulkDelete("keywords", null, { transaction });

      await queryInterface.bulkDelete("categories", null, { transaction });

      await transaction.commit();

      console.log("✅ Seeder Rollback Successful!");
    } catch (error) {
      await transaction.rollback();

      console.error("❌ Seeder Rollback Failed:", error);

      throw error;
    }
  },
};
