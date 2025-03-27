const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");

// File paths
const inputFilePath = path.join(__dirname, "categoriesKeywords.xlsx");
const outputFolder = path.join(__dirname, "json-outputs");

console.log("Looking for file at:", inputFilePath);

// Ensure the file exists
if (!fs.existsSync(inputFilePath)) {
  console.error("❌ Error: File not found. Please check the path.");
  process.exit(1);
}

// Ensure output folder exists
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// Convert Excel to JSON
const rawData = excelToJson({
  sourceFile: inputFilePath,
  header: { rows: 1 }, // Treat first row as headers
});

console.log("Extracted rawData:", JSON.stringify(rawData, null, 2));

const formattedData = {};
Object.keys(rawData).forEach((sheetName) => {
  const sheetData = rawData[sheetName];

  let currentCategory = null;
  formattedData[sheetName] = {};

  sheetData.forEach((row, index) => {
    const rowValues = Object.values(row);

    // Debugging: Check what row contains
    console.log(`Row ${index}:`, rowValues);

    if (rowValues.length === 1 && rowValues[0] && rowValues[0] !== "#VALUE!") {
      // If only one column has a value, it's a category
      currentCategory = rowValues[0].trim();
      formattedData[sheetName][currentCategory] = [];
    } else if (
      rowValues.length >= 4 &&
      rowValues[1] &&
      rowValues[2] &&
      rowValues[3]
    ) {
      // Product row: Ensure name, code, and price exist
      const [_, name, code, price] = rowValues;

      if (currentCategory) {
        formattedData[sheetName][currentCategory].push({
          Name: name.trim(),
          Code: code.trim(),
          Price: price,
          Image: `${code.trim()}.jpg`,
        });
      } else {
        console.warn(
          `⚠️ Skipping product row without category at index ${index}:`,
          rowValues
        );
      }
    }
  });

  // Write JSON file per sheet
  const outputFilePath = path.join(outputFolder, `${sheetName}.json`);
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(formattedData[sheetName], null, 2),
    "utf-8"
  );
  console.log(`✅ ${sheetName}.json saved in ${outputFolder}`);
});

console.log("✅ All sheets converted successfully!");
