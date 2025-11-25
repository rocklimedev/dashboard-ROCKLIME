// fix-product-codes.js
const fs = require("fs").promises;
const path = require("path");

// Load your actual JSON file
const jsonData = require("./duplicate_products.json"); // make sure this is correct path

// Mock brand (or pull from real data later)
const mockBrand = { brandName: "Grohe Premium" };

function generateRandomSuffix() {
  return Math.floor(Math.random() * 900 + 100).toString(); // 100-999
}

async function generateCode(product, existingCodes) {
  let last4 = "0000";

  // Use company_code from metaDetails if exists
  if (product.metaDetails) {
    const companyCodeEntry = product.metaDetails.find(
      (m) => m.slug === "companycode"
    );
    if (companyCodeEntry && companyCodeEntry.value) {
      const match = companyCodeEntry.value.toString().match(/\d{4}(?!.*\d)/);
      last4 = match ? match[0].padStart(4, "0") : "0000";
    }
  }

  // Fallback: use size from meta
  if (last4 === "0000" && product.meta) {
    const sizeValue =
      product.meta["06857cb5-3fbe-404b-bdef-657c8ae7c345"] || "";
    const cleaned = sizeValue.replace(/[\*\s]/g, "");
    last4 = cleaned.slice(-4).padStart(4, "0") || "0000";
  }

  const prefix = `E${"GR".slice(0, 2)}${mockBrand.brandName
    .slice(0, 2)
    .toUpperCase()}${last4}`;

  let newCode;
  let attempts = 0;

  do {
    if (attempts++ > 1000) throw new Error("Failed to generate unique code");
    const suffix = generateRandomSuffix();
    newCode = `${prefix}${suffix}`;
  } while (existingCodes.has(newCode));

  return newCode;
}

async function updateProductJson() {
  try {
    console.log("Processing duplicate_products.json...");

    // Use a Set for O(1) lookup
    const existingCodes = new Set(
      jsonData
        .filter((p) => p.product_code && p.product_code !== "undefined")
        .map((p) => p.product_code)
    );

    let updatedCount = 0;

    for (const product of jsonData) {
      // Fix: Check product_code (snake_case), not productCode
      if (!product.product_code || product.product_code === "undefined") {
        const newCode = await generateCode(product, existingCodes);
        product.product_code = newCode;
        existingCodes.add(newCode);
        updatedCount++;
        console.log(`Generated: ${newCode} → ${product.name}`);
      } else {
        existingCodes.add(product.product_code);
        console.log(`Kept: ${product.product_code} → ${product.name}`);
      }
    }

    // Write back to the same file
    const outputPath = path.resolve(__dirname, "duplicate_products.json");
    await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2));

    console.log(
      `Done! Updated ${updatedCount} products with unique product_code`
    );
    console.log(`Total products: ${jsonData.length}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

updateProductJson();
