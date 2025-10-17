// convertCsvToJson.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputFile = path.resolve(__dirname, "products.csv"); // your CSV file
const outputFile = path.resolve(__dirname, "products.json"); // output JSON

const results = [];

fs.createReadStream(inputFile)
  .pipe(
    csv({
      separator: "\t", // your file is TAB-separated, not comma-separated
      skipLines: 0,
      strict: false,
    })
  )
  .on("data", (row) => {
    const cleanedRow = {};

    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key
        .replace(/^"+|"+$/g, "")
        .replace(/\s+/g, "")
        .trim();
      const cleanValue = value ? value.replace(/^"+|"+$/g, "").trim() : null;

      cleanedRow[cleanKey] = cleanValue;
    }

    // Attempt to parse JSON-like columns
    ["meta", "images"].forEach((field) => {
      if (cleanedRow[field]) {
        try {
          cleanedRow[field] = JSON.parse(
            cleanedRow[field].replace(/^"+|"+$/g, "").replace(/\\"/g, '"')
          );
        } catch {
          // leave it as-is
        }
      }
    });

    results.push(cleanedRow);
  })
  .on("end", () => {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf8");
    console.log(`✅ Clean JSON written to ${outputFile}`);
  })
  .on("error", (err) => {
    console.error("❌ CSV parsing error:", err);
  });
