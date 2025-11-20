const fs = require("fs").promises;
const path = require("path");

// JSON data to process
const jsonData = require("./error.json");

// Mock brand
const mockBrand = { brandName: "Grohe Premium" };

// Generate a random 3-digit number as a string
function generateRandomSuffix() {
  return Math.floor(Math.random() * 900 + 100).toString(); // 100-999
}

async function generateCode(product, existingCodes) {
  let last4;

  // Check if company_code exists
  if (product.company_code) {
    const companyCode = `${product.company_code}`;
    const match = companyCode.match(/\d{4}(?!.*\d)/);
    last4 = match ? match[0] : "0000";
  } else {
    // Use size from meta, remove asterisks and spaces, take last 4 digits
    const size = product.meta["06857cb5-3fbe-404b-bdef-657c8ae7c345"] || "0000";
    const cleanedSize = size.replace(/[\*\s]/g, "");
    last4 = cleanedSize.slice(-4) || "0000";
  }

  const productType = "GR";

  // Prefix: E + first 2 of productType + first 2 of brandName + last4
  const prefix = `E${productType.slice(0, 2).toUpperCase()}${mockBrand.brandName
    .slice(0, 2)
    .toUpperCase()}${last4}`;

  let newCode;
  let attempts = 0;

  // Keep generating random suffix until it's unique
  do {
    if (attempts++ > 1000)
      throw new Error("Too many attempts generating unique code!");
    const suffix = generateRandomSuffix();
    newCode = `${prefix}${suffix}`;
  } while (existingCodes.includes(newCode));

  return newCode;
}

async function updateProductJson() {
  try {
    console.log("✅ Processing product.json...");

    // Collect existing codes
    const existingCodes = jsonData
      .filter((item) => item.productCode)
      .map((item) => item.productCode);

    for (const product of jsonData) {
      // Skip if already has productCode
      if (product.productCode) {
        console.log(
          `ℹ️ Already has code: ${product.name} (${product.productCode})`
        );
        continue;
      }

      // Generate new code
      const newCode = await generateCode(product, existingCodes);
      product.productCode = newCode;
      existingCodes.push(newCode);

      console.log(`✅ Added productCode "${newCode}" to "${product.name}"`);
    }

    // Save back
    const outputPath = path.resolve(__dirname, "product.json");
    await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2));
    console.log("🎉 product.json updated successfully.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

updateProductJson();
