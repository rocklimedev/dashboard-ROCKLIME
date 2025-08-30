const productData = require("./products_backup_2025-08-22T06-45-50-132Z.json");

// Valid brand IDs from the brands table
const validBrandIds = [
  "13847c2c-3c91-4bb2-a130-f94928658237",
  "25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab",
  "39fd411d-7c06-11f0-9e84-52540021303b",
  "4e3acf32-1e47-4d38-a6bb-417addd52ac0",
  "500b10a7-7686-11f0-9e84-52540021303b",
  "50105657-7686-11f0-9e84-52540021303b",
  "50106480-7686-11f0-9e84-52540021303b",
  "501073c4-7686-11f0-9e84-52540021303b",
  "50107b22-7686-11f0-9e84-52540021303b",
  "501083c0-7686-11f0-9e84-52540021303b",
  "70a6bfc1-7bf3-11f0-9e84-52540021303b",
  "70b2c3f3-7bf3-11f0-9e84-52540021303b",
  "987bb747-773d-11f0-9e84-52540021303b",
  "acbe7061-9b76-47d1-a509-e4b1f982a36f",
  "c69121e3-7686-11f0-9e84-52540021303b",
  "d642a7f4-9bb9-4d91-bcf3-fd63b438b85e",
];

function checkInvalidBrandIds() {
  console.log("Checking for invalid brandId values in product data...");

  let invalidProducts = [];
  let missingBrandIdCount = 0;

  productData.forEach((product, index) => {
    const brandId = product.brandId;
    const productName = product.name || "Unknown Product";
    const productCode = product.product_code || "Unknown Code";

    if (!brandId) {
      missingBrandIdCount++;
      invalidProducts.push({
        index,
        productName,
        productCode,
        brandId: null,
        issue: "Missing brandId",
      });
    } else if (!validBrandIds.includes(brandId)) {
      invalidProducts.push({
        index,
        productName,
        productCode,
        brandId,
        issue: "Invalid brandId (not found in brands table)",
      });
    }
  });

  if (invalidProducts.length === 0 && missingBrandIdCount === 0) {
    console.log("✅ All brandId values are valid!");
  } else {
    console.log(
      `❌ Found ${invalidProducts.length} products with invalid brandId values:`
    );
    invalidProducts.forEach(
      ({ index, productName, productCode, brandId, issue }) => {
        console.log(
          `Product #${index + 1}: ${productName} (${productCode}) - brandId: ${
            brandId || "null"
          } - ${issue}`
        );
      }
    );
    if (missingBrandIdCount > 0) {
      console.log(
        `❌ Found ${missingBrandIdCount} products with missing brandId values.`
      );
    }
  }

  return invalidProducts;
}

// Run the check
checkInvalidBrandIds();
