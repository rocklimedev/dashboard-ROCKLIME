const fs = require("fs");
const path = require("path");

// Input and output file paths
const inputFilePath = path.join(__dirname, "permissions.csv");
const outputFilePath = path.join(__dirname, "permissions.json");

// Helper function to parse CSV lines safely
function parseCSVLine(line) {
  // Split by tab or comma
  return line
    .split(/\t|,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
    .map((field) => field.replace(/^"|"$/g, "").trim());
}

// Read and convert CSV to JSON grouped by module
fs.readFile(inputFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("❌ Error reading the CSV file:", err);
    return;
  }

  // Split lines and clean empty ones
  const lines = data.split(/\r?\n/).filter((line) => line.trim() !== "");

  // Extract headers
  const headers = parseCSVLine(lines[0]);

  // Convert each line into an object
  const allObjects = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });
    return obj;
  });

  // Group objects by module
  const groupedData = allObjects.reduce((acc, item) => {
    const moduleName = item.module || "unknown";
    if (!acc[moduleName]) acc[moduleName] = [];
    acc[moduleName].push(item);
    return acc;
  }, {});

  // Write grouped JSON file
  fs.writeFile(
    outputFilePath,
    JSON.stringify(groupedData, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.error("❌ Error writing JSON file:", err);
      } else {
        console.log(`✅ Successfully grouped and saved: ${outputFilePath}`);
      }
    }
  );
});
