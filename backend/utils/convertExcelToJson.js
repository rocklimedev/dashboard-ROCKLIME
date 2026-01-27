const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");

// === CONFIG ===
const inputFilePath = path.join(
  __dirname,
  "../seeder/data/20-1-26 TILE STOCK.xlsx",
);
const outputFolder = path.join(__dirname, "json-outputs");
const outputFile = path.join(outputFolder, "all_sheets_data.json");

// === VALIDATE INPUT ===
if (!fs.existsSync(inputFilePath)) {
  console.error("Excel file not found at:", inputFilePath);
  process.exit(1);
}

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// === CONVERT EXCEL - PROCESS ALL SHEETS WITHOUT PREDEFINED COLUMN MAPPING ===
const result = excelToJson({
  sourceFile: inputFilePath,
  header: { rows: 1 }, // Skip the first row as header
});

// Process each sheet
const finalOutput = {};

Object.keys(result).forEach((sheetName) => {
  let rows = result[sheetName];

  // Remove empty rows (rows where all values are empty)
  const cleanedData = rows.filter((row) =>
    Object.values(row).some((v) => v && String(v).trim() !== ""),
  );

  finalOutput[sheetName] = cleanedData;

  console.log(`Processed ${cleanedData.length} rows from sheet: ${sheetName}`);
  console.log(
    `Columns found in ${sheetName}:`,
    Object.keys(cleanedData[0] || {}),
  );
});

// === WRITE JSON ===
fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 2), "utf-8");

console.log("✅ All sheets processed successfully!");
console.log("📁 Saved to:", outputFile);
console.log("📊 Total sheets processed:", Object.keys(finalOutput).length);
