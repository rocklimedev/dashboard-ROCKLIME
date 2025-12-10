const { Sequelize, Op } = require("sequelize");
const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const Category = require("../models/category"); // Child category
const ParentCategory = require("../models/parentCategory"); // Top-level
const Brand = require("../models/brand"); // Add Brand model
const sequelize = require("../config/database");
const slugify = require("slugify");

// Load product data from JSON file
const productData = require("../seeder/backup/products_backup_2025-08-22T06-45-50-132Z.json");

const fieldTypeMap = {
  sellingPrice: { fieldType: "number", unit: "INR" },
  purchasingPrice: { fieldType: "number", unit: "INR" },
  company_code: { fieldType: "string", unit: null },
};

// ✅ CREATE OR FETCH PARENT CATEGORY
async function createOrGetParentCategory(name) {
  const slug = slugify(name, { lower: true });
  let parent = await ParentCategory.findOne({ where: { slug } });
  if (!parent) {
    console.log(`Creating parent category: ${name} (slug: ${slug})`);
    parent = await ParentCategory.create({
      id: Sequelize.DataTypes.UUIDV4(),
      name,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return parent.id;
}

// ✅ VALIDATE OR FETCH PARENT CATEGORY BY ID
async function validateOrGetParentCategory(
  id,
  fallbackName = "General Products"
) {
  if (!id) {
    console.log(
      `No parent category ID provided, using fallback: ${fallbackName}`
    );
    return await createOrGetParentCategory(fallbackName);
  }
  const parent = await ParentCategory.findOne({ where: { id } });
  if (!parent) {
    console.log(
      `Parent category ID ${id} not found, using fallback: ${fallbackName}`
    );
    return await createOrGetParentCategory(fallbackName);
  }
  console.log(`Found parent category ID: ${id}`);
  return parent.id;
}

// ✅ CREATE OR FETCH DEFAULT BRAND
async function createOrGetDefaultBrand() {
  const defaultBrand = await Brand.findOne({
    where: { brandName: "Default Brand" },
  });
  if (!defaultBrand) {
    console.log("Creating default brand");
    const brand = await Brand.create({
      id: Sequelize.DataTypes.UUIDV4(),
      brandName: "Default Brand",
      brandSlug: "default-brand",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return brand.id;
  }
  return defaultBrand.id;
}

// ✅ CREATE OR FETCH CHILD CATEGORY UNDER PARENT
async function createOrGetCategory(name, parentCategoryId, brandId) {
  const slug = slugify(name, { lower: true }); // Generate slug from name
  let category = await Category.findOne({
    where: { name, parentCategoryId },
  });
  if (!category) {
    console.log(
      `Creating category: ${name} (slug: ${slug}) under parent ID: ${parentCategoryId} with brand ID: ${brandId}`
    );
    category = await Category.create({
      categoryId: Sequelize.DataTypes.UUIDV4(),
      name,
      slug,
      parentCategoryId,
      brandId, // Use provided brandId
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return category.categoryId;
}

// ✅ PRODUCT META CREATOR
async function createOrGetProductMeta(title, fieldType, unit) {
  let productMeta = await ProductMeta.findOne({ where: { title } });
  if (!productMeta) {
    console.log(
      `Creating product meta: ${title} (type: ${fieldType}, unit: ${unit})`
    );
    productMeta = await ProductMeta.create({
      id: Sequelize.DataTypes.UUIDV4(),
      title,
      fieldType,
      unit,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return productMeta.id;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await sequelize.sync();
      console.log("Database synced");

      // Pre-create default brand
      const defaultBrandId = await createOrGetDefaultBrand();

      // Pre-create ProductMeta entries to ensure meta IDs exist
      const metaIds = {};
      for (const [key, { fieldType, unit }] of Object.entries(fieldTypeMap)) {
        metaIds[key] = await createOrGetProductMeta(key, fieldType, unit);
      }

      for (const product of productData) {
        console.log(
          `Processing product: ${product.name} (${product.product_code})`
        );

        // Validate product data
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
          "General Products"
        );

        // Step 2: Validate or get brandId
        let brandId = product.brandId;
        if (brandId) {
          const brand = await Brand.findOne({ where: { id: brandId } });
          if (!brand) {
            console.warn(`Brand ID ${brandId} not found, using default`);
            brandId = defaultBrandId;
          }
        } else {
          console.log(
            `No brand ID provided for ${product.name}, using default`
          );
          brandId = defaultBrandId;
        }

        // Step 3: Handle Child Category
        let categoryId = product.categoryId;
        if (!categoryId) {
          console.log(
            `No category ID for ${product.name}, creating fallback category`
          );
          categoryId = await createOrGetCategory(
            product.name,
            parentCategoryId,
            brandId
          );
        } else {
          // Verify category exists
          const category = await Category.findOne({
            where: { categoryId: categoryId },
          });
          if (!category) {
            console.log(
              `Category ID ${categoryId} not found, creating fallback`
            );
            categoryId = await createOrGetCategory(
              product.name,
              parentCategoryId,
              brandId
            );
          }
        }

        // Step 4: Handle Product Meta
        const meta = {};
        if (Object.keys(product.meta || {}).length > 0) {
          for (const [metaId, value] of Object.entries(product.meta)) {
            const metaExists = await ProductMeta.findOne({
              where: { id: metaId },
            });
            if (metaExists) {
              meta[metaId] = value;
            } else {
              console.warn(`Meta ID ${metaId} not found, skipping`);
            }
          }
        } else {
          // Create default meta if none provided
          for (const [key, { fieldType, unit }] of Object.entries(
            fieldTypeMap
          )) {
            let value;
            if (key === "company_code")
              value = product.product_code || "unknown";
            if (key === "sellingPrice" || key === "purchasingPrice")
              value = product.meta?.[key] || 0;
            const metaId = await createOrGetProductMeta(key, fieldType, unit);
            meta[metaId] = value;
          }
        }

        // Step 5: Prepare Product Data
        const productRecord = {
          productId: product.productId || Sequelize.DataTypes.UUIDV4(),
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
          brand_parentcategoriesId: product.brand_parentcategoriesId, // Use validated parentCategoryId
          isFeatured: product.isFeatured || false,
          productType: product.productType || "simple",
          vendorId: product.vendorId || null,
          meta,
          createdAt: product.createdAt
            ? new Date(product.createdAt)
            : new Date(),
          updatedAt: product.updatedAt
            ? new Date(product.updatedAt)
            : new Date(),
        };

        // Step 6: Insert or Update Product
        console.log(`Upserting product: ${productRecord.name}`);
        await Product.upsert(productRecord);
      }

      console.log("✅ Seeding complete with parent & child categories.");
    } catch (error) {
      console.error("❌ Error during seeding:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await Product.destroy({
        where: {
          product_code: {
            [Op.in]: productData.map((item) => item.product_code),
          },
        },
      });
      console.log("✅ Product seed rollback completed.");
    } catch (error) {
      console.error("❌ Error during rollback:", error);
      throw error;
    }
  },
};
