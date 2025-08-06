const products = require("./backup/products_backup_2025-08-05T05-36-53-955Z.json");
// Function to check for duplicate company_code entries
function findDuplicateCompanyCodes(products) {
  const seen = new Map();
  const duplicates = [];

  for (const product of products) {
    const code = product.name;

    if (seen.has(code)) {
      // If already seen, push both original and duplicate once
      if (!duplicates.find((p) => p.name === code)) {
        duplicates.push(seen.get(code));
      }
      duplicates.push(product);
    } else {
      seen.set(code, product);
    }
  }

  return duplicates;
}

// Example usage
const duplicates = findDuplicateCompanyCodes(products);
console.log("Duplicate products based on company_code:", duplicates);
