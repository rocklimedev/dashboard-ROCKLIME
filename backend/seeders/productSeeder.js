const { Sequelize, DataTypes } = require("sequelize");
const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const sequelize = require("../config/database");

const productsData = require("../seeder/backup/products_backup_2025-08-05T05-36-53-955Z.json");

const fieldTypeMap = {
  sellingPrice: { fieldType: "number", unit: "INR" },
  purchasingPrice: { fieldType: "number", unit: "INR" },
  company_code: { fieldType: "string", unit: null },
  barcode: { fieldType: "string", unit: null },
  product_segment: { fieldType: "string", unit: null },
  productGroup: { fieldType: "string", unit: null },
};

async function createOrGetProductMeta(title, fieldType, unit) {
  let productMeta = await ProductMeta.findOne({
    where: { title },
  });

  if (!productMeta) {
    productMeta = await ProductMeta.create({
      title,
      fieldType,
      unit,
    });
  }

  return productMeta.id;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Ensure the database is synced
      await sequelize.sync();

      // Process each product in the JSON data
      for (const productData of productsData) {
        const {
          productId,
          name,
          product_code,
          quantity,
          discountType,
          alert_quantity,
          tax,
          description,
          images,
          brandId,
          categoryId,
          isFeatured,
          createdAt,
          updatedAt,
          userId,
          productType,
          vendorId,
          brand_parentcategoriesId,
          ...extraFields
        } = productData;

        // Prepare meta object for extra fields
        const meta = {};
        for (const [key, value] of Object.entries(extraFields)) {
          if (value !== null && value !== undefined) {
            // Skip null or undefined values
            const { fieldType, unit } = fieldTypeMap[key] || {
              fieldType: "string",
              unit: null,
            }; // Default to string if not mapped
            const metaId = await createOrGetProductMeta(key, fieldType, unit);
            meta[metaId] = value;
          }
        }

        // Prepare product data
        const product = {
          productId: productId || Sequelize.DataTypes.UUIDV4(),
          name,
          product_code,
          quantity,
          discountType,
          alert_quantity,
          tax: tax ? parseFloat(tax) : null,
          description,
          images: images ? JSON.stringify(images) : null,
          brandId,
          categoryId,
          isFeatured,
          userId,
          productType,
          vendorId,
          brand_parentcategoriesId,
          meta: Object.keys(meta).length > 0 ? meta : null,
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date(),
        };

        // Insert or update the product
        await Product.upsert(product);
      }

      console.log("Product seeding completed successfully.");
    } catch (error) {
      console.error("Error seeding products:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Delete all products created by this seeder
      await Product.destroy({
        where: {
          productId: productsData.map((p) => p.productId),
        },
      });
      console.log("Product seeding reverted successfully.");
    } catch (error) {
      console.error("Error reverting product seeding:", error);
      throw error;
    }
  },
};
