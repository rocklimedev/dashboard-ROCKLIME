const fs = require("fs");

// Load files
const stockData = require("./output.json");
const products = require("./cleaned.json");

const META_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";

// Normalize helper
const normalize = (str) =>
  str?.toLowerCase().replace(/\s+/g, " ").trim();

// Track matched stock
const matchedStockCodes = new Set();
const matchedStockNames = new Set();

const updatedProducts = [];
const inventoryHistory = [];

// 🔁 Process products
products.forEach((product) => {
  let matchedStock = null;
  const productCode = product.meta?.[META_KEY];

  // ✅ 1. Match by company_code (STRICT)
  if (productCode) {
    matchedStock = stockData.find(
      (s) => s.company_code === productCode
    );

    if (matchedStock) {
      matchedStockCodes.add(matchedStock.company_code);
    }
  }

  // ✅ 2. Fallback ONLY if company_code missing
  if (!productCode) {
    matchedStock = stockData.find(
      (s) => normalize(s.name) === normalize(product.name)
    );

    if (matchedStock) {
      matchedStockNames.add(normalize(matchedStock.name));
    }
  }

  // ✅ 3. ONLY process if matched
  if (matchedStock) {
    const oldQty = product.quantity || 0;
    const newQty = matchedStock.quantity;

    // ONLY if quantity actually changed
    if (oldQty !== newQty) {
      const change = newQty - oldQty;

      // 📦 Updated product
      updatedProducts.push({
        ...product,
        quantity: newQty,
      });

      // 🧾 Inventory history entry (NO UUID)
      inventoryHistory.push({
        productId: product.productId,
        change: change,
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

// 🔁 Unmatched stock ONLY
const productnotfound = stockData.filter((stock) => {
  const isMatchedByCode = matchedStockCodes.has(stock.company_code);
  const isMatchedByName = matchedStockNames.has(
    normalize(stock.name)
  );

  return !isMatchedByCode && !isMatchedByName;
});

// 💾 Save files
fs.writeFileSync(
  "./updated-stock.json",
  JSON.stringify(updatedProducts, null, 2)
);

fs.writeFileSync(
  "./productnotfound.json",
  JSON.stringify(productnotfound, null, 2)
);

fs.writeFileSync(
  "./inventory-history.json",
  JSON.stringify(inventoryHistory, null, 2)
);

console.log("✅ Only changed products saved");
console.log("📦 Unmatched stock saved");
console.log("🧾 Inventory history generated (no UUID)");