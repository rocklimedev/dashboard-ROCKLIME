const fs = require("fs");
const path = require("path");

// Load files
const dummy = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../dummy.json"), "utf-8")
);
const noProductCode = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./notFoundProductCode.json"), "utf-8")
);

// Step 1: Create a lookup map from dummy.json
const dummyMap = {};
dummy.forEach((item) => {
  const code = String(item["Company Code"]).trim();
  dummyMap[code] = {
    "Product Code": item["Product Code"],
    "Product Segment": item["Product Segment"],
    "Product Description": item["Product Description"],
    "Product group": item["Product group"],
  };
});

// Step 2: Update the noProductCode.json entries
noProductCode.forEach((product) => {
  const code = String(product.company_code).trim();
  if (dummyMap[code]) {
    console.log(
      `Updating ${code} with Product Code: ${dummyMap[code]["Product Code"]}`
    );
    product["Product Code"] = dummyMap[code]["Product Code"];
    product["Product Segment"] = dummyMap[code]["Product Segment"];
    product["Product Description"] = dummyMap[code]["Product Description"];
    product["Product group"] = dummyMap[code]["Product group"];
  }
});

// Step 3: Save updated file
fs.writeFileSync(
  path.join(__dirname, "./updatedNoProductCode.json"),
  JSON.stringify(noProductCode, null, 2),
  "utf-8"
);

console.log("✅ updatedNoProductCode.json saved successfully!");
