const fs = require("fs").promises;
const path = require("path");

// JSON data to process
const jsonData = require("./colston.json");

// Mock category and brand objects (since no DB access)
const mockBrand = { brandName: "Colston" }; // Assumed brand name

async function generateCode(row, parentcategories, existingCodes) {
  // Extract company_code from row[2]
  const companyCode = row[2] ? `CMP-${row[2]}` : "CMP-0000";

  // Extract last 4 digits from company_code (e.g., "CMP-767" -> "0767")
  const match = companyCode.match(/\d{4}(?!.*\d)/);
  const last4 = match ? match[0] : "0000";

  // Generate prefix: E + first 2 letters of category + first 2 letters of brand + last 4 digits
  const prefix = `E${parentcategories
    .slice(0, 2)
    .toUpperCase()}${mockBrand.brandName.slice(0, 2).toUpperCase()}${last4}`;

  // Extract suffixes from existing codes with the same prefix
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

    // Collect existing product codes to ensure uniqueness
    const existingCodes = jsonData
      .filter((item) => item.row.length >= 4 && item.row[4]) // Check for existing productCode
      .map((item) => item.row[4]);

    // Process each item in the JSON data
    for (const item of jsonData) {
      const { parentcategories, row } = item;

      // Skip single-field rows (categories)
      if (row.length === 1) {
        console.log(`ℹ️ Skipping category: "${row[0]}"`);
        continue;
      }

      // For four-field rows, generate and add productCode
      if (row.length === 4) {
        const newCode = await generateCode(
          row,
          parentcategories,
          existingCodes
        );

        // Add productCode as the fifth field
        row.push(newCode);
        existingCodes.push(newCode); // Update existing codes for uniqueness

        console.log(`✅ Added productCode "${newCode}" to "${row[1]}"`);
      } else if (row.length > 4) {
        console.warn(`⚠️ Row already has ${row.length} fields: "${row[1]}"`);
      }
    }

    // Write updated JSON back to product.json
    const outputPath = path.resolve(__dirname, "product.json");
    await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2));
    console.log("🎉 product.json updated successfully.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

updateProductJson();
