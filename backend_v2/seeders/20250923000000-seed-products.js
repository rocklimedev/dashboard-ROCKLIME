const { Sequelize, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const Category = require("../models/category");
const ParentCategory = require("../models/parentCategory");
const Brand = require("../models/brand");
const sequelize = require("../config/database");
const slugify = require("slugify");

// Load product data from JSON file
const productData = require("./product.json");

// Define fieldTypeMap for ProductMeta fields
const fieldTypeMap = {
  sellingPrice: { fieldType: "number", unit: "INR" },
  purchasingPrice: { fieldType: "number", unit: "INR" },
  company_code: { fieldType: "string", unit: null },
  sizeMM: { fieldType: "number", unit: "mm" },
  product_segment: { fieldType: "string", unit: null },
  areaCoveredPerBox: { fieldType: "number", unit: "sqft" },
  barcode: { fieldType: "string", unit: null },
  mrpPerPcs: { fieldType: "number", unit: "INR" },
  sizeFeet: { fieldType: "string", unit: "feet" },
  productGroup: { fieldType: "string", unit: null },
  mrpPerBox: { fieldType: "number", unit: "INR" },
  length: { fieldType: "number", unit: "inch" },
  width: { fieldType: "number", unit: "inch" },
  areaCoveredPerPcs: { fieldType: "number", unit: "sqft" },
  pcsPerBox: { fieldType: "number", unit: "pcs" },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      await sequelize.sync({ force: false, transaction });
      console.log("Database synced:", Object.keys(sequelize.models));

      // Pre-check IDs
      for (const product of productData) {
        if (!product.product_code) {
          console.warn(
            `Skipping product with missing product_code: ${product.name}`
          );
          continue;
        }
        const brand = await Brand.findOne({
          where: { id: product.brandId },
          transaction,
        });
        if (!brand) {
          console.error(
            `Brand ID ${product.brandId} not found for ${product.name}`
          );
          continue;
        }
        const category = await Category.findOne({
          where: { categoryId: product.categoryId },
          transaction,
        });
        if (!category) {
          console.error(
            `Category ID ${product.categoryId} not found for ${product.name}`
          );
          continue;
        }
        const parentCategory = await ParentCategory.findOne({
          where: { id: product.brand_parentcategoriesId },
          transaction,
        });
        if (!parentCategory) {
          console.warn(
            `Parent Category ID ${product.brand_parentcategoriesId} not found for ${product.name}, will use fallback`
          );
        }
      }

      // Pre-create ProductMeta entries
      const metaIds = {};
      for (const [key, { fieldType, unit }] of Object.entries(fieldTypeMap)) {
        metaIds[key] = await createOrGetProductMeta(
          key,
          fieldType,
          unit,
          transaction
        );
      }
      console.log("Created ProductMeta IDs:", metaIds);

      for (const product of productData) {
        console.log(
          `Processing product: ${product.name} (${product.product_code})`
        );

        if (!product.name || !product.product_code) {
          console.warn(
            `Skipping product with missing name or product_code: ${JSON.stringify(
              product
            )}`
          );
          continue;
        }

        // Step 1: Handle Parent Category
        let parentCategoryId = await validateOrGetParentCategory(
          product.brand_parentcategoriesId,
          "General Products",
          transaction
        );

        // Step 2: Validate brandId
        const brandId = await validateBrandId(
          product.brandId,
          product.name,
          product.product_code,
          transaction
        );
        if (!brandId) continue;

        // Step 3: Handle Child Category
        let categoryId = await validateCategoryId(
          product.categoryId,
          product.name,
          product.product_code,
          parentCategoryId,
          brandId,
          transaction
        );

        // Step 4: Handle Product Meta
        const meta = {};
        for (const [key, value] of Object.entries(product.meta || {})) {
          if (metaIds[key]) {
            meta[metaIds[key]] = value;
          } else {
            console.warn(`Unknown meta key ${key} for product ${product.name}`);
          }
        }
        if (Object.keys(meta).length === 0) {
          for (const [key, { fieldType, unit }] of Object.entries(
            fieldTypeMap
          )) {
            let value;
            if (key === "company_code")
              value = product.product_code || "unknown";
            if (key === "sellingPrice" || key === "purchasingPrice")
              value = product.meta?.[key] || 0;
            meta[metaIds[key]] = value;
          }
        }

        // Step 5: Prepare Product Data
        const productRecord = {
          productId: uuidv4(),
          name: product.name,
          product_code: product.product_code,
          description: product.description || product.name,
          quantity: product.quantity || 0,
          discountType: product.discountType || null,
          alert_quantity: product.alert_quantity || 0,
          tax: product.tax || null,
          images: product.images || JSON.stringify([]),
          brandId: product.brandId,
          categoryId: product.categoryId,
          brand_parentcategoriesId: product.brand_parentcategoriesId,
          isFeatured: product.isFeatured || false,
          vendorId: product.vendorId || null,
          meta: product.meta,
          createdAt: product.createdAt
            ? new Date(product.createdAt)
            : new Date(),
          updatedAt: product.updatedAt
            ? new Date(product.updatedAt)
            : new Date(),
        };

        // Step 6: Insert or Update Product
        console.log(`Upserting product: ${productRecord.name}`);
        await Product.upsert(productRecord, {
          transaction,
          conflictFields: ["product_code"],
        });
        console.log(`Successfully upserted product: ${productRecord.name}`);
      }

      await transaction.commit();
      console.log("✅ Seeding complete with parent & child categories.");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error during seeding:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      await Product.destroy({
        where: {
          product_code: {
            [Op.in]: productData.map((item) => item.product_code),
          },
        },
        transaction,
      });
      await transaction.commit();
      console.log("✅ Product seed rollback completed.");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error during rollback:", error);
      throw error;
    }
  },
};

// Helper functions (unchanged)
async function createOrGetParentCategory(name, transaction) {
  const slug = slugify(name, { lower: true });
  let parent = await ParentCategory.findOne({ where: { slug }, transaction });
  if (!parent) {
    console.log(`Creating parent category: ${name} (slug: ${slug})`);
    parent = await ParentCategory.create(
      {
        id: uuidv4(),
        name,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { transaction }
    );
  }
  return parent.id;
}

async function validateOrGetParentCategory(id, fallbackName, transaction) {
  if (!id) {
    console.log(
      `No parent category ID provided, using fallback: ${fallbackName}`
    );
    return await createOrGetParentCategory(fallbackName, transaction);
  }
  const parent = await ParentCategory.findOne({ where: { id }, transaction });
  if (!parent) {
    console.log(
      `Parent category ID ${id} not found, using fallback: ${fallbackName}`
    );
    return await createOrGetParentCategory(fallbackName, transaction);
  }
  console.log(`Found parent category ID: ${id}`);
  return parent.id;
}

async function validateBrandId(brandId, productName, productCode, transaction) {
  if (!brandId) {
    console.warn(
      `No brand ID provided for ${productName} (${productCode}), skipping product`
    );
    return null;
  }
  const brand = await Brand.findOne({ where: { id: brandId }, transaction });
  if (!brand) {
    console.warn(
      `Brand ID ${brandId} not found for ${productName} (${productCode}), skipping product`
    );
    return null;
  }
  console.log(`Found brand ID: ${brandId} for ${productName}`);
  return brand.id;
}

async function createOrGetCategory(
  name,
  parentCategoryId,
  brandId,
  transaction
) {
  const slug = slugify(name, { lower: true });
  let category = await Category.findOne({
    where: { name, parentCategoryId },
    transaction,
  });
  if (!category) {
    console.log(
      `Creating category: ${name} (slug: ${slug}) under parent ID: ${parentCategoryId}`
    );
    category = await Category.create(
      {
        categoryId: uuidv4(),
        name,
        slug,
        parentCategoryId,
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { transaction }
    );
  }
  return category.categoryId;
}

async function validateCategoryId(
  categoryId,
  productName,
  productCode,
  parentCategoryId,
  brandId,
  transaction
) {
  if (!categoryId) {
    console.log(`No category ID for ${productName}, creating fallback`);
    return await createOrGetCategory(
      productName,
      parentCategoryId,
      brandId,
      transaction
    );
  }
  const category = await Category.findOne({
    where: { categoryId },
    transaction,
  });
  if (!category) {
    console.log(
      `Category ID ${categoryId} not found for ${productName}, creating fallback`
    );
    return await createOrGetCategory(
      productName,
      parentCategoryId,
      brandId,
      transaction
    );
  }
  return categoryId;
}

async function createOrGetProductMeta(title, fieldType, unit, transaction) {
  let productMeta = await ProductMeta.findOne({
    where: { title },
    transaction,
  });
  if (!productMeta) {
    console.log(
      `Creating product meta: ${title} (type: ${fieldType}, unit: ${unit})`
    );
    productMeta = await ProductMeta.create(
      {
        id: uuidv4(),
        title,
        fieldType,
        unit,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { transaction }
    );
  }
  return productMeta.id;
}
