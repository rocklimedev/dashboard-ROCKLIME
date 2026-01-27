// stock-update-offline-safe.js
const fs = require("fs").promises;
const path = require("path");

const MODEL_META_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const STOCK_DATE_MESSAGE =
  "19.01.2026 Stock SANITARY  i have taken out abckup of products";

async function main() {
  try {
    // ────────────────────────────────────────────────
    //  PATHS – already set by you
    // ────────────────────────────────────────────────
    const PRODUCTS_BACKUP_PATH = path.join(
      __dirname,
      "../seeder/backup/products_backup_2026-01-26T15-06-01-355Z.json",
    );
    const STOCK_COUNT_PATH = path.join(
      __dirname,
      "../utils/json-outputs/sanitary_stock.json",
    );
    const OUTPUT_AUDIT_PATH = path.join(
      __dirname,
      "inventoryupdate-audit.json",
    );
    const OUTPUT_DB_PAYLOAD_PATH = path.join(
      __dirname,
      "db-ready-payload.json",
    );

    // Load data
    const products = JSON.parse(
      await fs.readFile(PRODUCTS_BACKUP_PATH, "utf-8"),
    );
    const stockItems = JSON.parse(await fs.readFile(STOCK_COUNT_PATH, "utf-8"));

    console.log(`Loaded ${products.length} products`);
    console.log(`Processing ${stockItems.length} stock items`);

    const auditEntries = [];
    const notFound = [];
    const historyRecords = []; // for inventory_history table
    const productUpdates = []; // minimal fields for UPDATE products SET quantity = ?

    for (const item of stockItems) {
      const raw = item["Name & Code"]?.trim();
      if (!raw) continue;

      // Extract probable model code
      let codeCandidate = null;
      const tokens = raw.split(/\s+/);
      for (const t of tokens) {
        if (/^[A-Za-z0-9\-_]{5,}$/.test(t)) {
          codeCandidate = t;
          break;
        }
      }

      const nameSearch = raw.toLowerCase().replace(/\s+/g, " ").trim();

      let match = null;
      let matchMethod = "none";

      // 1. Strongest: exact model code in meta
      if (codeCandidate) {
        match = products.find((p) => {
          const mc = p.meta?.[MODEL_META_KEY];
          return mc && String(mc).trim() === codeCandidate;
        });
        if (match) matchMethod = "meta_model_code";
      }

      // 2. Fallback: name similarity
      if (!match) {
        match = products.find((p) => {
          if (!p.name) return false;
          const pName = p.name.toLowerCase();
          return pName.includes(nameSearch) || nameSearch.includes(pName);
        });
        if (match) matchMethod = "name_similarity";
      }

      if (!match) {
        notFound.push({
          input: raw,
          requested_qty: Number(item.Quantity) || 0,
          code_attempt: codeCandidate,
          reason: "No product matched by model code or name",
        });
        console.warn(`Not found → ${raw}`);
        continue;
      }

      const oldQty = Number(match.quantity ?? 0);
      const newQty = Number(item.Quantity ?? 0);

      if (oldQty === newQty) {
        console.log(
          `Unchanged → ${match.product_code || match.name} (${oldQty})`,
        );
        continue;
      }

      const delta = newQty - oldQty;

      // ── Audit / human readable ─────────────────────────────────────
      auditEntries.push({
        productId: match.productId,
        product_code: match.product_code || null,
        name: match.name,
        model_code: match.meta?.[MODEL_META_KEY] || null,
        old_quantity: oldQty,
        new_quantity: newQty,
        delta,
        match_method: matchMethod,
        input_string: raw,
        timestamp: new Date().toISOString(),
      });

      // ── DB update payload (products table) ─────────────────────────
      productUpdates.push({
        productId: match.productId,
        quantity: newQty,
        // optional: updatedAt: new Date().toISOString()  ← let DB handle
      });

      // ── Inventory history record (ready for bulkCreate) ────────────
      historyRecords.push({
        productId: match.productId,
        change: delta,
        quantityAfter: newQty,
        action: "correction", // stock-take adjustment
        message: STOCK_DATE_MESSAGE,
        // orderNo: null,                   // optional
        // userId: "your-user-uuid-here",   // ← fill if you want
        // createdAt / updatedAt: let DB or hook handle
      });

      console.log(
        `Planned → ${match.product_code || "—"} | ${match.name}\n` +
          `         ${oldQty} → ${newQty}  (${delta > 0 ? "+" : ""}${delta})`,
      );
    }

    // ── Final output ──────────────────────────────────────────────────
    const result = {
      summary: {
        processed: stockItems.length,
        updated: auditEntries.length,
        unchanged: stockItems.length - auditEntries.length - notFound.length,
        not_found: notFound.length,
        run_at: new Date().toISOString(),
      },
      updates_audit: auditEntries,
      not_found_items: notFound,
    };

    const dbPayload = {
      products_to_update: productUpdates, // → UPDATE ... WHERE productId IN (...)
      inventory_history_to_insert: historyRecords,
    };

    await fs.writeFile(
      OUTPUT_AUDIT_PATH,
      JSON.stringify(result, null, 2),
      "utf-8",
    );
    await fs.writeFile(
      OUTPUT_DB_PAYLOAD_PATH,
      JSON.stringify(dbPayload, null, 2),
      "utf-8",
    );

    console.log(`\nDone.`);
    console.log(`→ Audit file:     ${OUTPUT_AUDIT_PATH}`);
    console.log(`→ DB payload:     ${OUTPUT_DB_PAYLOAD_PATH}`);
    console.log(`→ ${auditEntries.length} products to update`);
    console.log(`→ ${historyRecords.length} history records to insert`);

    if (notFound.length > 0) {
      console.log(`\n⚠️ ${notFound.length} unmatched items:`);
      notFound.forEach((n) => console.log(`  - ${n.input}`));
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (err.code === "ENOENT") console.error("Check file paths");
  }
}

main();
