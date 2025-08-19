const fs = require("fs").promises;
const path = require("path");

// JSON data to process
const jsonData = require("./product.json");

// Mock brand (replace if you fetch from DB)
const mockBrand = { brandName: "Tiles" };

async function generateCode(product, existingCodes) {
  const companyCode = product.company_code
    ? `CMP-${product.company_code}`
    : "CMP-0000";

  // Extract last 4 digits from company_code
  const match = companyCode.match(/\d{4}(?!.*\d)/);
  const last4 = match ? match[0] : "0000";

  // Use productType (adhesive, etc.) as prefix + brand + last4 digits
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

    // Collect existing codes (if products already have productCode field)
    const existingCodes = jsonData
      .filter((item) => item.productCode)
      .map((item) => item.productCode);

    for (const product of jsonData) {
      if (!product.company_code) {
        console.warn(
          `⏩ Skipping product without company_code: ${product.name}`
        );
        continue;
      }

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
