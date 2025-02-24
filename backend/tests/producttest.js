const fs = require("fs");
const assert = require("assert");

// File path for cleaned products
const cleanedProductsFilePath = "./cleaned.json";
const vendorsFilePath = "./data/vendors.json";

// Load JSON function
function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Load cleaned products and vendors
const products = loadJSON(cleanedProductsFilePath);
const vendorsData = loadJSON(vendorsFilePath);
const vendors = vendorsData.vendors || [];

// Create vendor prefix map
const vendorMap = vendors.reduce((acc, vendor) => {
  const vendorPrefix = vendor.vendorName.substring(0, 2).toUpperCase();
  acc[vendor.vendorId] = vendorPrefix;
  return acc;
}, {});

// Test function for Product Code format
function testProductCodeFormat(product) {
  const { "Product Code": productCode, "Company Code": companyCode, "Brand_Slug": brandSlug, "Vendor_Slug": vendorSlug } = product;

  assert.ok(productCode, "❌ Product Code is missing!");

  const expectedVendorPrefix = vendorMap[vendorSlug] || "XX"; // Default "XX" if vendor not found
  const expectedCompanyCodePart = String(companyCode).substring(0, 4); // First 4 digits of Company Code

  const regex = new RegExp(`^E${expectedVendorPrefix}${brandSlug}${expectedCompanyCodePart}\\d{3}$`);

  assert.ok(regex.test(productCode), `❌ Invalid Product Code format: ${productCode}`);
}

// Run tests
try {
  console.log(`🔍 Running Product Code tests on ${products.length} products...`);
  
  products.forEach(product => testProductCodeFormat(product));

  console.log("✅ All Product Code tests passed!");
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1); // Exit with failure code
}
