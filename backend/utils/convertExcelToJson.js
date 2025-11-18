const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");

// === CONFIG ===
const inputFilePath = path.join(__dirname, "./PRODUCT REPLACEMENTS (1).xlsx");
const outputFolder = path.join(__dirname, "json-outputs");
const outputFile = path.join(outputFolder, "product_replacements.json");

// === VALIDATE INPUT ===
if (!fs.existsSync(inputFilePath)) {
  console.error("Excel file not found at:", inputFilePath);
  process.exit(1);
}

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// === CONVERT EXCEL WITHOUT TRUSTING HEADERS ===
const result = excelToJson({
  sourceFile: inputFilePath,
  columnToKey: {
    A: "S.NO",
    B: "REMOVE",
    C: "REPLACE",
    D: "MRP",
  },
  header: { rows: 1 }, // skip header row in sheet
});

const finalOutput = {};

Object.keys(result).forEach((sheetName) => {
  const rows = result[sheetName];

  // remove empty rows
  const cleanedData = rows.filter((row) =>
    Object.values(row).some((v) => v && String(v).trim() !== "")
  );

  finalOutput[sheetName] = cleanedData;

  console.log(`Processed ${cleanedData.length} rows from ${sheetName}`);
});

// === WRITE JSON ===
fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 2), "utf-8");

console.log("Saved to:", outputFile);
