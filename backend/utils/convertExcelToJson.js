const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");

// === CONFIG ===
const inputFilePath = path.join(__dirname, "./PRODUCT REPLACEMENTS.xlsx");
const outputFolder = path.join(__dirname, "json-outputs");
const outputFile = path.join(outputFolder, "product_replacements.json");

// === VALIDATE INPUT ===
if (!fs.existsSync(inputFilePath)) {
  console.error("❌ Excel file not found at:", inputFilePath);
  process.exit(1);
}

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// === CONVERT EXCEL ===
const result = excelToJson({
  sourceFile: inputFilePath,
  header: { rows: 1 }, // First row is header
});

// === PROCESS SHEETS ===
Object.keys(result).forEach((sheetName) => {
  const rows = result[sheetName];
  const cleanedData = [];

  rows.forEach((row, index) => {
    const values = Object.values(row);

    // Skip if all cells are empty
    if (values.every((v) => !v || String(v).trim() === "")) return;

    const sno = String(row.A || "").trim();
    const removeCode = String(row.B || "").trim();
    const replaceCode = String(row.C || "").trim();
    const extraCol = row.D ? String(row.D).trim() : null;

    const entry = {
      SNO: sno || null,
      REMOVE: removeCode && removeCode !== "----" ? removeCode : null,
      REPLACE: replaceCode && replaceCode !== "----" ? replaceCode : null,
    };

    // If there’s a 4th column like “MRP - 75400” extract number
    if (extraCol) {
      const match = extraCol.match(/(\d+)/);
      if (match) entry.MRP = match[1];
    }

    cleanedData.push(entry);
  });

  // === WRITE TO JSON ===
  fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), "utf-8");
  console.log(
    `✅ ${sheetName}: Saved ${cleanedData.length} entries to ${outputFile}`
  );
});

console.log("✅ Conversion complete!");
