const fs = require("fs");

const productsFilePath = "./output.json";
const vendorsFilePath = "./data/vendors.json";
const cleanedProductsFilePath = "./cleaned.json";

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
const vendorsData = loadJSON(vendorsFilePath); // Load the full JSON object
const vendors = vendorsData.vendors || []; // Extract the array or default to an empty array

// Now vendors is an array, so reduce() will work correctly
const vendorMap = vendors.reduce((acc, vendor) => {
  const vendorPrefix = vendor.vendorName.substring(0, 2).toUpperCase(); // First 2 letters
  acc[vendor.vendorId] = vendorPrefix;
  return acc;
}, {});


// Track incremental codes
const productCodeTracker = {};

// Function to generate a valid Product Code
// Function to generate a valid Product Code
function generateProductCode(product) {
    const { "Company Code": companyCode, "Brand_Slug": brandSlug, "Vendor_Slug": vendorSlug } = product;
  
    if (!companyCode || !brandSlug || !vendorSlug) return null;
  
    // Extract first 4 digits of Company Code
    const companyCodeStr = String(companyCode);
    const first4Digits = companyCodeStr.substring(0, 4);
  
    // Extract Vendor Prefix
    const vendorPrefix = vendorMap[vendorSlug] || "XX"; // Default to "XX" if vendor not found
  
    // Define the base product code format (Remove `_`)
    const baseProductCode = `E${vendorPrefix}${brandSlug}${first4Digits}`;
  
    // Incremental logic for unique product codes
    if (!productCodeTracker[baseProductCode]) {
      productCodeTracker[baseProductCode] = 1;
    } else {
      productCodeTracker[baseProductCode]++;
    }
  
    // Generate final product code
    const incrementalCode = String(productCodeTracker[baseProductCode]).padStart(3, "0"); // Ensure 3-digit format
    return `${baseProductCode}${incrementalCode}`;  // Removed `_` from format
  }
  

// Process products and update Product Code
const updatedProducts = products.map(product => {
  product["Product Code"] = generateProductCode(product);
  return product;
});

// Write the updated JSON to cleaned.json
fs.writeFileSync(cleanedProductsFilePath, JSON.stringify(updatedProducts, null, 2), "utf8");

console.log("✅ cleaned.json has been generated with valid Product Codes!");
