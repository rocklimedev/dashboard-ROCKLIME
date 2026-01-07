// fix-product-codes.js
const fs = require("fs").promises;
const path = require("path");

// ────────────────────────────────────────────────
//   CONFIGURATION – ADJUST THESE FOR YOUR BRAND
// ────────────────────────────────────────────────
const BRAND = {
  shortCode: "CO", // "GR" for GROHE
  namePrefix: "COLSTON", // used in readable name if needed
};

const MODEL_META_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a"; // ← your model number key

// ────────────────────────────────────────────────

async function main() {
  try {
    // Load the actual file – update path/filename if needed
    const inputFile = path.join(__dirname, "updated_products.json"); // or "duplicate_products.json"
    const jsonData = require(inputFile);

    console.log(`Loaded ${jsonData.length} products`);

    // Collect all already-good codes (for uniqueness check)
    const existingCodes = new Set(
      jsonData
        .filter(
          (p) =>
            typeof p.product_code === "string" && p.product_code.length >= 8
        )
        .map((p) => p.product_code.trim())
    );

    let updatedCount = 0;

    for (const product of jsonData) {
      // Skip if it already has a valid-looking product_code
      if (
        product.product_code &&
        typeof product.product_code === "string" &&
        product.product_code.length >= 8 &&
        !product.product_code.includes("undefined")
      ) {
        console.log(
          `Keeping existing: ${product.product_code.padEnd(12)} → ${
            product.name
          }`
        );
        existingCodes.add(product.product_code);
        continue;
      }

      // ─── Try to get model number from meta ───────────────────────
      let baseCode = "0000";

      if (product.meta && product.meta[MODEL_META_KEY]) {
        const raw = String(product.meta[MODEL_META_KEY]).trim();
        // Keep only digits, take last 4 (most GROHE models end with 4 digits)
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 4) {
          baseCode = digits.slice(-4);
        } else if (digits.length > 0) {
          baseCode = digits.padStart(4, "0");
        }
      }

      // ─── Build prefix ─────────────────────────────────────────────
      // Format: E + GR + first two uppercase letters of brand name + last4digits
      // Example: EGRGR3009XXXX  (you can adjust this pattern)
      const prefix = `E${BRAND.shortCode}${BRAND.namePrefix
        .slice(0, 2)
        .toUpperCase()}${baseCode}`;

      // ─── Generate unique code with random 3-digit suffix ─────────
      let newCode;
      let attempts = 0;
      const MAX_ATTEMPTS = 2000;

      do {
        if (attempts++ > MAX_ATTEMPTS) {
          throw new Error(
            `Cannot generate unique code for ${product.name} after ${MAX_ATTEMPTS} attempts`
          );
        }

        const suffix = Math.floor(Math.random() * 900 + 100).toString(); // 100–999
        newCode = `${prefix}${suffix}`;
      } while (existingCodes.has(newCode));

      // Assign and track
      product.product_code = newCode;
      existingCodes.add(newCode);
      updatedCount++;

      console.log(
        `Generated : ${newCode} → ${product.name} (model: ${
          product.meta?.[MODEL_META_KEY] || "—"
        })`
      );
    }

    // ─── Save back (you can change filename here) ─────────────────
    const outputPath = path.join(__dirname, "products_with_codes.json");
    // or keep original name: path.join(__dirname, "updated_products.json")

    await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2));

    console.log("\n" + "═".repeat(60));
    console.log(`Success! Processed ${jsonData.length} products`);
    console.log(`  • Newly generated codes : ${updatedCount}`);
    console.log(
      `  • Kept existing codes   : ${jsonData.length - updatedCount}`
    );
    console.log(`Output saved to: ${outputPath}`);
    console.log("═".repeat(60));
  } catch (err) {
    console.error("ERROR:", err.message);
    if (err.stack) console.error(err.stack.split("\n").slice(1, 4).join("\n"));
  }
}

main();
