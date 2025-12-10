const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Path to the SQL file
const sqlFilePath = path.join(__dirname, "../products.sql");

// Read SQL file
const rawSQL = fs.readFileSync(sqlFilePath, "utf8");

// Match the insert values block
const matches = rawSQL.match(/INSERT INTO .*?VALUES\s*(.*);/is);
if (!matches || matches.length < 2) {
  console.error("No SQL values block found.");
  process.exit(1);
}

// Extract values
let valuesBlock = matches[1];

// Cleanup newlines, trailing commas, etc.
valuesBlock = valuesBlock
  .replace(/\),\s*\(/g, ")___(") // temporarily separate rows
  .replace(/^\s*\(/, "") // remove leading (
  .replace(/\);\s*$/, "") // remove trailing );
  .replace(/\),\s*$/, "") // trailing comma
  .split("___"); // split into rows

// Define the column headers (adjust to your schema!)
const headers = [
  "productId",
  "product_segment",
  "productGroup",
  "name",
  "product_code",
  "company_code",
  "sellingPrice",
  "purchasingPrice",
  "quantity",
  "discountType",
  "barcode",
  "alert_quantity",
  "tax",
  "description",
  "images",
  "brandId",
  "categoryId",
  "createdAt",
  "updatedAt",
  "user_id",
  "isFeatured",
];

const data = valuesBlock.map((row) => {
  // Remove leading/trailing () and split by comma
  const items = row
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

  // Clean quotes and whitespace
  return items.map((cell) => {
    const trimmed = cell.trim();
    if (trimmed === "NULL") return null;
    if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
      return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    if (!isNaN(trimmed)) return Number(trimmed);
    return trimmed;
  });
});

// Build worksheet rows
const worksheetData = [headers, ...data];

const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

const outputPath = path.join(__dirname, "output.xlsx");
xlsx.writeFile(workbook, outputPath);

console.log("✅ Excel file created:", outputPath);
