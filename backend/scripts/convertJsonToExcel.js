const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// === CONFIG ===
const inputFile = path.join(__dirname, "./normalized.json"); // your JSON file
const outputFile = path.join(__dirname, "output.xlsx");

// === READ JSON ===
if (!fs.existsSync(inputFile)) {
  console.error("❌ JSON file not found");
  process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

// === CREATE WORKBOOK ===
const workbook = XLSX.utils.book_new();

// If JSON is an array → single sheet
if (Array.isArray(jsonData)) {
  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
} else {
  // If JSON is an object → multiple sheets
  Object.keys(jsonData).forEach((key) => {
    const data = jsonData[key];

    if (Array.isArray(data)) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, key);
    }
  });
}

// === WRITE EXCEL FILE ===
XLSX.writeFile(workbook, outputFile);

console.log("✅ Excel file created:", outputFile);
