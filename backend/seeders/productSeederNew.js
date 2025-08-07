const { v4: uuidv4 } = require("uuid");
const BrandParentCategory = require("../models/brandParentCategory");
const Product = require("../models/product");
const Category = require("../models/category");

// JSON data to seed
const jsonData = require("./colston.json");

// Seeder function for Sequelize
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Default values (based on reference product data)
    const defaultBrandId = "13847c2c-3c91-4bb2-a130-f94928658237"; // From reference product
    const defaultProductType = "tiles"; // From reference product
    const defaultTax = "18.00"; // Match DECIMAL(5,2) schema
    const defaultAlertQuantity = 10;
    const defaultDiscountType = "percent";
    const defaultQuantity = 0;
    const defaultCategoryId = "772ce520-d386-41be-ae07-4803616b477b"; // From reference product

    try {
      // Process each item in the JSON data
      for (const item of jsonData) {
        const { parentcategories, row } = item;

        // Step 1: Check or create parent category
        let parentCategory = await BrandParentCategory.findOne({
          where: { name: parentcategories },
        });

        if (!parentCategory) {
          parentCategory = await BrandParentCategory.create({
            id: uuidv4(),
            name: parentcategories,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        let categoryId;
        let productData;

        // Step 2: Handle dynamic category creation for single-field rows
        if (row.length === 1) {
          const categoryName = row[0] || "Unnamed Category";

          // Check if category exists under the parent category
          let category = await Category.findOne({
            where: {
              name: categoryName,
              brand_parentcategoriesId: parentCategory.id,
            },
          });

          if (!category) {
            category = await Category.create({
              categoryId: uuidv4(),
              name: categoryName,
              brand_parentcategoriesId: parentCategory.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          categoryId = category.categoryId;

          // Prepare product data for single-field row (category only)
          productData = {
            productId: uuidv4(),
            name: categoryName,
            product_code: `PROD-${uuidv4().slice(0, 8)}`, // Unique fallback
            quantity: defaultQuantity,
            discountType: defaultDiscountType,
            alert_quantity: defaultAlertQuantity,
            tax: defaultTax,
            description: categoryName,
            images: JSON.stringify([]),
            isFeatured: false,
            userId: null,
            productType: defaultProductType,
            brandId: defaultBrandId,
            categoryId: categoryId, // Use dynamic category ID
            vendorId: null,
            brand_parentcategoriesId: parentCategory.id,
            meta: {}, // No meta fields for single-field rows
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } else {
          // Step 3: Dissect the row array for multi-field rows
          const [image, name, productCode, sellingPrice] =
            row.length >= 4
              ? row
              : [
                  row[0] || null,
                  row[1] || row[0],
                  row[2] || null,
                  row[3] || null,
                ];

          // Ensure product_code is not null
          if (!productCode) {
            throw new Error(`Product code cannot be null for product: ${name}`);
          }

          // Step 4: Prepare meta fields (match reference product)
          const metaDetails = [
            {
              id: uuidv4(),
              title: "barcode",
              value: uuidv4(), // Generate a UUID for barcode
              fieldType: "string",
              unit: null,
            },
            {
              id: uuidv4(),
              title: "sellingPrice",
              value: sellingPrice ? String(sellingPrice) : "0.00",
              fieldType: "number",
              unit: "INR",
            },
            {
              id: uuidv4(),
              title: "productGroup",
              value: name ? name.split(" ")[0] : "Unknown", // Use first word of name
              fieldType: "string",
              unit: null,
            },
            {
              id: uuidv4(),
              title: "company_code",
              value: `${productCode}`, // Derive from product_code
              fieldType: "string",
              unit: null,
            },
          ];

          // Create meta JSON object
          const meta = metaDetails.reduce((acc, detail) => {
            acc[detail.id] = detail.value;
            return acc;
          }, {});

          // Step 5: Prepare product data for multi-field rows
          productData = {
            productId: uuidv4(),
            name: name || "Unnamed Product",
            product_code: String(productCode),
            quantity: defaultQuantity,
            discountType: defaultDiscountType,
            alert_quantity: defaultAlertQuantity,
            tax: defaultTax,
            description: name || "No description available",
            images: image ? JSON.stringify([image]) : JSON.stringify([]),
            isFeatured: false,
            userId: null,
            productType: defaultProductType,
            brandId: defaultBrandId,
            categoryId: defaultCategoryId, // Use default category ID
            vendorId: null,
            brand_parentcategoriesId: parentCategory.id,
            meta,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        // Step 6: Check for unique product_code
        const existingProduct = await Product.findOne({
          where: { product_code: productData.product_code },
        });
        if (existingProduct) {
          productData.product_code = `PROD-${uuidv4().slice(0, 8)}`; // Generate new unique code
        }

        // Step 7: Create product
        await Product.create(productData);
      }

      console.log("Products seeded successfully!");
    } catch (error) {
      console.error("Error seeding products:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("products", null, {});
    await queryInterface.bulkDelete("categories", null, {});
    await queryInterface.bulkDelete("brand_parentcategories", null, {});
    console.log("Seeded products, categories, and parent categories removed!");
  },
};
