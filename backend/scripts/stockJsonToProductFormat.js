const fs = require("fs");
const path = require("path");

/**
 * Transform function
 */
function transformData(input) {
  if (!Array.isArray(input)) {
    throw new Error("Input must be an array");
  }

  return input
    .map((item, index) => {
      if (!item.B || typeof item.B !== "string") {
        console.warn(`⚠️ Skipping invalid B at index ${index}`);
        return null;
      }

      const parts = item.B.trim().split(/\s+/);

      const company_code = parts.shift(); // first word
      const name = parts.join(" ");       // rest

      return {
        company_code: company_code || "",
        name: name || "",
        stock: item.D ?? 0
      };
    })
    .filter(Boolean);
}

/**
 * MAIN
 */
function main() {
  try {
    const inputPath = path.join(__dirname, "./json-outputs/all_sheets_data.json");
    const outputPath = path.join(__dirname, "output.json");

    // ✅ Ensure file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error("❌ all-sheets-data.json not found in current directory");
    }

    console.log("📥 Reading data from all-sheets-data.json...");

    const rawData = fs.readFileSync(inputPath, "utf-8");
    const parsedData = JSON.parse(rawData);

    console.log("🔄 Transforming data...");

    const transformed = transformData(parsedData);

    console.log("📤 Writing output.json...");

    fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));

    console.log("✅ Done!");
    console.log(`📁 Output saved at: ${outputPath}`);
    console.log(`📦 Total records processed: ${transformed.length}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();