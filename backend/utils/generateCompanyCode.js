const fs = require("fs");

const productsFilePath = "./output.json";
const vendorsFilePath = "./data/vendors.json";
const cleanedProductsFilePath = "../cleaned.json";

// Load JSON files
function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Load product and vendor data
const products = loadJSON(productsFilePath);
const vendorsData = loadJSON(vendorsFilePath);
const vendors = vendorsData.vendors || [];

// Create a map of vendor ID to prefix
const vendorMap = vendors.reduce((acc, vendor) => {
  const vendorPrefix = vendor.vendorName.substring(0, 2).toUpperCase();
  acc[vendor.vendorId] = vendorPrefix;
  return acc;
}, {});

// Track incremental codes
const productCodeTracker = {};

// Function to generate a valid Product Code
function generateProductCode(product) {
  const {
    "Company Code": companyCode,
    Brand_Slug: brandSlug,
    Vendor_Slug: vendorSlug,
  } = product;

  if (!companyCode || !brandSlug || !vendorSlug) return null;

  const companyCodeStr = String(companyCode);
  const first4Digits = companyCodeStr.substring(0, 4);

  const vendorPrefix = vendorMap[vendorSlug] || "XX";

  const baseProductCode = `E${vendorPrefix}${brandSlug}${first4Digits}`;

  if (!productCodeTracker[baseProductCode]) {
    productCodeTracker[baseProductCode] = 1;
  } else {
    productCodeTracker[baseProductCode]++;
  }

  const incrementalCode = String(productCodeTracker[baseProductCode]).padStart(
    3,
    "0"
  );
  return `${baseProductCode}${incrementalCode}`;
}

// Track how many products get a valid Product Code
let validProductCodeCount = 0;

const updatedProducts = products.map((product) => {
  const code = generateProductCode(product);
  if (code) validProductCodeCount++;

  product["Product Code"] = code;
  return product;
});

// Write the updated products to cleaned.json
fs.writeFileSync(
  cleanedProductsFilePath,
  JSON.stringify(updatedProducts, null, 2),
  "utf8"
);

// Log the result
console.log("✅ cleaned.json has been generated with valid Product Codes!");
console.log(`📊 Total products: ${products.length}`);
console.log(`✅ Valid Product Codes generated: ${validProductCodeCount}`);
console.log(
  `❌ Missing/Invalid Product Codes: ${products.length - validProductCodeCount}`
);
