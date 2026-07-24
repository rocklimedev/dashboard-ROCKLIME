const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// ==============================
// CONFIG
// ==============================
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const SELLING_PRICE_KEY = "9ba862ef-f993-4873-95ef-1fef10036aa5";
const MODEL_META_KEY = "1e19b647-1138-11f1-b773-52540021303b";

// Update according to brand
const BRAND = {
  shortCode: "GR", // Example: GR
  namePrefix: "GR",
};

// Files
const updatedProducts = require("./json-outputs/all_sheets_data2.json");
const productBackup = require("./json-outputs/products_backup.json");

// ==============================
// OUTPUT ARRAYS
// ==============================
const updatedOutput = [];
const missingProducts = [];

// ==============================
// LOOKUP MAPS
// ==============================
const productMap = new Map();
const existingProductCodes = new Set();

// Build lookup from backup
for (const product of productBackup) {
  const companyCode = product?.meta?.[COMPANY_CODE_KEY];

  if (companyCode) {
    productMap.set(String(companyCode).trim().toUpperCase(), product);
  }

  if (product.product_code) {
    existingProductCodes.add(String(product.product_code).trim().toUpperCase());
  }
}

console.log(`Loaded ${productMap.size} products from backup.`);

// ==============================
// PRODUCT CODE GENERATOR
// ==============================
function generateProductCode(product) {
  let baseCode = "0000";

  if (product.meta && product.meta[MODEL_META_KEY]) {
    const raw = String(product.meta[MODEL_META_KEY]).trim();

    const digits = raw.replace(/\D/g, "");

    if (digits.length >= 4) {
      baseCode = digits.slice(-4);
    } else if (digits.length > 0) {
      baseCode = digits.padStart(4, "0");
    }
  }

  const prefix = `E${BRAND.shortCode}${BRAND.namePrefix
    .slice(0, 2)
    .toUpperCase()}${baseCode}`;

  let code;

  do {
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    code = `${prefix}${suffix}`;
  } while (existingProductCodes.has(code));

  existingProductCodes.add(code);

  return code;
}

// ==============================
// PROCESS
// ==============================
for (const item of updatedProducts) {
  const companyCode = String(item.product_code).trim().toUpperCase();

  const product = productMap.get(companyCode);

  // =====================================
  // FOUND → UPDATE SELLING PRICE
  // =====================================
  if (product) {
    if (!product.meta) {
      product.meta = {};
    }

    product.meta[SELLING_PRICE_KEY] = item.selling_price;

    updatedOutput.push(product);
    continue;
  }

  // =====================================
  // NOT FOUND → CREATE NEW PRODUCT JSON
  // =====================================

  const tempProduct = {
    meta: {},
  };

  // If model number exists in source json
  if (item.model_number) {
    tempProduct.meta[MODEL_META_KEY] = item.model_number;
  }

  const generatedProductCode = generateProductCode(tempProduct);

  missingProducts.push({
    name: item.name,

    product_code: generatedProductCode,

    quantity: 0,

    masterProductId: null,

    isMaster: false,

    variantOptions: null,

    variantKey: null,

    skuSuffix: null,

    discountType: null,

    alert_quantity: 1,

    tax: 0,

    description: item.name,

    images: [],

    isFeatured: false,

    status: "active",

    brandId: null,

    categoryId: null,

    vendorId: null,

    brand_parentcategoriesId: null,

    meta: {
      [SELLING_PRICE_KEY]: item.selling_price,

      [COMPANY_CODE_KEY]: item.product_code,

      ...(item.model_number && {
        [MODEL_META_KEY]: item.model_number,
      }),
    },
  });
}

// ==============================
// WRITE FILES
// ==============================

fs.writeFileSync(
  path.join(__dirname, "updated_products_output.json"),
  JSON.stringify(updatedOutput, null, 2),
);

fs.writeFileSync(
  path.join(__dirname, "missing_products.json"),
  JSON.stringify(missingProducts, null, 2),
);

// ==============================
// SUMMARY
// ==============================

console.log("\n=====================================");
console.log(`Updated Products : ${updatedOutput.length}`);
console.log(`Missing Products : ${missingProducts.length}`);
console.log("=====================================");
console.log(
  `Updated JSON : ${path.join(__dirname, "updated_products_output.json")}`,
);
console.log(`Missing JSON : ${path.join(__dirname, "missing_products.json")}`);
