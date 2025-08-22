const fs = require("fs").promises;
const path = require("path");

// JSON data to process
const jsonData = require("./new.json");

// Mock brand
const mockBrand = { brandName: "Colston" };

async function generateCode(product, existingCodes) {
  let last4;

  // Check if company_code exists
  if (product.company_code) {
    const companyCode = `CMP-${product.company_code}`;
    const match = companyCode.match(/\d{4}(?!.*\d)/);
    last4 = match ? match[0] : "0000";
  } else {
    // Use size from meta, remove asterisks and spaces, take last 4 digits
    const size = product.meta["06857cb5-3fbe-404b-bdef-657c8ae7c345"] || "0000";
    const cleanedSize = size.replace(/[\*\s]/g, "");
    last4 = cleanedSize.slice(-4) || "0000";
  }

  // Generate prefix: E + first 2 chars of productType + first 2 chars of brandName + last4
  const prefix = `E${product.productType
    .slice(0, 2)
    .toUpperCase()}${mockBrand.brandName.slice(0, 2).toUpperCase()}${last4}`;

  // Collect existing suffixes for this prefix
  const suffixes = existingCodes
    .filter((code) => code.startsWith(prefix))
    .map((code) => code.replace(prefix, ""))
    .filter((s) => /^\d{3}$/.test(s))
    .map(Number);

  let suffix = 1;
  while (suffixes.includes(suffix)) suffix++;

  return `${prefix}${suffix.toString().padStart(3, "0")}`;
}

async function updateProductJson() {
  try {
    console.log("✅ Processing product.json...");

    // Collect existing codes
    const existingCodes = jsonData
      .filter((item) => item.productCode)
      .map((item) => item.productCode);

    for (const product of jsonData) {
      // If already has productCode, skip
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
