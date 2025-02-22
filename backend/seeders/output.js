const xlsx = require("xlsx");  // Import xlsx package
const fs = require("fs");  // Import file system module

// Load the Excel file
const workbook = xlsx.readFile("../backend/seeders/Product.xlsx");  // Reads Excel file
const sheetName = workbook.SheetNames[0];  // Get the first sheet name
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);  
// Converts sheet data to JSON

// Convert to JSON and save
fs.writeFileSync("output.json", JSON.stringify(data, null, 4));  
// Writes JSON to a file with indentation

console.log("Excel converted to JSON successfully!");
