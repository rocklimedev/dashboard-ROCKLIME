const fs = require("fs");

// Load files
const rawStockData = require("./json-outputs/all_sheets_data2.json");
const products = require("./json-outputs/product_backup.json");

const META_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";

// Normalize helper
const normalize = (str) => str?.toLowerCase().replace(/\s+/g, " ").trim();

// -----------------------------------------------------
// 1. Normalize stock data (IMPORTANT FIX)
// -----------------------------------------------------
const stockData = rawStockData.map((item) => {
  const codeKey = Object.keys(item).find(
    (k) => k !== "name" && k !== "quantity",
  );

  return {
    productCode: item[codeKey],
    name: item.name,
    quantity: item.quantity,
  };
});

// -----------------------------------------------------
// Track matched stock
// -----------------------------------------------------
const matchedStockCodes = new Set();
const matchedStockNames = new Set();

const updatedProducts = [];
const inventoryHistory = [];

// -----------------------------------------------------
// 2. Process products
// -----------------------------------------------------
products.forEach((product) => {
  let matchedStock = null;

  const productCode = product.meta?.[META_KEY];

  // ✅ 1. STRICT match by productCode
  if (productCode) {
    matchedStock = stockData.find((s) => s.productCode === productCode);

    if (matchedStock) {
      matchedStockCodes.add(matchedStock.productCode);
    }
  }

  // ✅ 2. fallback name match
  if (!matchedStock) {
    matchedStock = stockData.find((s) => {
      const stockName = normalize(s.name);
      const productName = normalize(product.name);

      return stockName.includes(productName) || productName.includes(stockName);
    });

    if (matchedStock) {
      matchedStockNames.add(normalize(matchedStock.name));
    }
  }

  // ✅ 3. Only process if matched
  if (matchedStock) {
    const oldQty = Number(product.quantity || 0);
    const newQty = Number(matchedStock.quantity || 0);

    if (oldQty !== newQty) {
      const change = newQty - oldQty;

      // 📦 Updated product
      updatedProducts.push({
        ...product,
        quantity: newQty,
      });

      // 🧾 Inventory history
      inventoryHistory.push({
        productId: product.productId,
        change,
        quantityAfter: newQty,
        action: change > 0 ? "add-stock" : "adjustment",
        orderNo: null,
        userId: null,
        message: `Stock updated via script: ${oldQty} → ${newQty}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
});

// -----------------------------------------------------
// 3. Unmatched stock
// -----------------------------------------------------
const productnotfound = stockData.filter((stock) => {
  const isMatchedByCode = matchedStockCodes.has(stock.productCode);
  const isMatchedByName = matchedStockNames.has(normalize(stock.name));

  return !isMatchedByCode && !isMatchedByName;
});

// -----------------------------------------------------
// 4. Save files
// -----------------------------------------------------
fs.writeFileSync(
  "./updated-stock.json",
  JSON.stringify(updatedProducts, null, 2),
);

fs.writeFileSync(
  "./productnotfound.json",
  JSON.stringify(productnotfound, null, 2),
);

fs.writeFileSync(
  "./inventory-history.json",
  JSON.stringify(inventoryHistory, null, 2),
);

// -----------------------------------------------------
console.log("✅ Only changed products saved");
console.log("📦 Unmatched stock saved");
console.log("🧾 Inventory history generated");
