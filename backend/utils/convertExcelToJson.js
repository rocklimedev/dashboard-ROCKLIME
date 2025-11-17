const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");

// === CONFIG ===
const inputFilePath = path.join(
  __dirname,
  "../seeder/data/CM Contractors.xlsx"
);
const outputFolder = path.join(__dirname, "json-outputs");
const outputFile = path.join(outputFolder, "vendors_contact_list.json");

// === VALIDATE INPUT ===
if (!fs.existsSync(inputFilePath)) {
  console.error("❌ Excel file not found at:", inputFilePath);
  process.exit(1);
}

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// === CONVERT EXCEL WITH HEADERS AS KEYS ===
const result = excelToJson({
  sourceFile: inputFilePath,
  header: { rows: 1 }, // First row used as keys
  columnToKey: {
    "*": "{{columnHeader}}", // force actual header names
  },
});

const finalOutput = {};

Object.keys(result).forEach((sheetName) => {
  const rows = result[sheetName];

  // remove fully empty rows
  const cleanedData = rows.filter((row) =>
    Object.values(row).some((v) => v && String(v).trim() !== "")
  );

  finalOutput[sheetName] = cleanedData;

  console.log(`✅ ${sheetName}: ${cleanedData.length} rows processed`);
});

// === WRITE JSON ===
fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 2), "utf-8");

console.log("✅ All sheets saved to:", outputFile);
