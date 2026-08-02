// generate-colston-products.js
//
// Reconciles raw Colston product data against the existing product backup file.
// - Matches raw Colston products to existing backup products.
// - Existing matches -> written to update_colston_products.json (in backup format, fields refreshed).
// - No match found  -> written to new_products.json (new backup-format record, fresh product_code generated).
//
// USAGE:
//   node generate-colston-products.js
//
// EXPECTED INPUT FILES (same folder, or edit the paths below):
//   ./colston_data_raw.json   <- raw Colston export (array of raw objects)
//   ./product_backup.json     <- existing full product list in backup/target format (array)
//
// OUTPUT FILES:
//   ./update_colston_products.json
//   ./new_products.json

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

// ────────────────────────────────────────────────
//   CONFIG
// ────────────────────────────────────────────────
const COLSTON_BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";
const BRAND_PARENT_CATEGORY_ID = "f7940b5e-8d97-43be-b37b-0fd6b56e431a"; // seen on existing Colston records

// Raw-field UUID keys (same keys reused inside backup.meta)
const KEY_INTERNAL_ID = "1cf23921-49cd-11f1-93ac-52540021303b"; // numeric source/model id -> MATCH KEY
const KEY_HSN = "1cf286a9-49cd-11f1-93ac-52540021303b"; // HSN / tariff code
const KEY_UNIT = "1cf288ba-49cd-11f1-93ac-52540021303b"; // unit (PCS, Sets, ...)
const KEY_PRICE = "9ba862ef-f993-4873-95ef-1fef10036aa5"; // price
const KEY_CODE = "d11da9f9-3f2e-4536-8236-9671200cca4a"; // model/company code string
const KEY_TYPE = "81cd6d76-d7d2-4226-b48e-6704e6224c2b"; // "Goods" etc (not present in raw sample, left untouched if missing)
const INPUT_RAW_FILE = path.join(__dirname, "./products_with_media.json");
const INPUT_BACKUP_FILE = path.join(
  __dirname,
  "./json-outputs/products_backup.json",
);
const OUTPUT_UPDATE_FILE = path.join(__dirname, "update_colston_products.json");
const OUTPUT_NEW_FILE = path.join(__dirname, "new_products.json");

// ────────────────────────────────────────────────
//   PRODUCT CODE GENERATION
//   Detects the existing "ECLCO########" style pattern from the backup file
//   and continues the sequence for new products (falls back to a prefix+
//   random-suffix scheme if no pattern is found).
// ────────────────────────────────────────────────
function buildCodeGenerator(existingBackupProducts) {
  const existingCodes = new Set(
    existingBackupProducts
      .map((p) => p.product_code)
      .filter((c) => typeof c === "string" && c.length > 0),
  );

  // Find the most common alphabetic prefix among Colston backup codes, and the
  // current max numeric suffix, e.g. "ECLCO00007656" -> prefix "ECLCO", width 8, max 7656
  const colstonCodes = existingBackupProducts
    .filter(
      (p) =>
        p.brandId === COLSTON_BRAND_ID && typeof p.product_code === "string",
    )
    .map((p) => p.product_code);

  let prefix = "ECLCO";
  let width = 8;
  let maxNum = 0;

  const pattern = /^([A-Z]+)(\d+)$/;
  for (const code of colstonCodes) {
    const m = code.match(pattern);
    if (!m) continue;
    const [, pfx, digits] = m;
    prefix = pfx;
    width = digits.length;
    const num = parseInt(digits, 10);
    if (num > maxNum) maxNum = num;
  }

  let counter = maxNum;

  return function nextCode() {
    let code;
    do {
      counter += 1;
      code = `${prefix}${String(counter).padStart(width, "0")}`;
    } while (existingCodes.has(code));
    existingCodes.add(code);
    return code;
  };
}

// ────────────────────────────────────────────────
//   MAIN
// ────────────────────────────────────────────────
async function main() {
  const [rawData, backupData] = await Promise.all([
    fs.readFile(INPUT_RAW_FILE, "utf8").then(JSON.parse),
    fs.readFile(INPUT_BACKUP_FILE, "utf8").then(JSON.parse),
  ]);

  console.log(
    `Loaded ${rawData.length} raw records, ${backupData.length} backup records`,
  );

  // Only work with Colston raw records
  const colstonRaw = rawData.filter((p) => p.brandId === COLSTON_BRAND_ID);
  console.log(`Filtered to ${colstonRaw.length} Colston raw records`);

  // Build lookup: company_code -> backup product (only among Colston backup records)
  // Match key: raw.company_code  <->  backup.meta[KEY_CODE] ("d11da9f9-...")
  const normalizeCode = (c) =>
    typeof c === "string" ? c.trim().toUpperCase() : c;

  const backupByCompanyCode = new Map();
  for (const p of backupData) {
    if (p.brandId !== COLSTON_BRAND_ID) continue;
    const code = p.meta && p.meta[KEY_CODE];
    if (code !== undefined && code !== null && code !== "") {
      backupByCompanyCode.set(normalizeCode(code), p);
    }
  }

  const nextCode = buildCodeGenerator(backupData);

  const updated = [];
  const created = [];
  const now = new Date().toISOString();

  for (const raw of colstonRaw) {
    const internalId = raw[KEY_INTERNAL_ID];
    const rawCode = normalizeCode(raw.company_code);
    const match =
      rawCode !== undefined ? backupByCompanyCode.get(rawCode) : undefined;

    // Normalize raw image into the backup's stringified-array image format
    const imagesArray = raw.images ? [raw.images] : [];
    const imagesStr = JSON.stringify(imagesArray);

    if (match) {
      // ── UPDATE existing product, keep identity fields (productId, product_code, etc.) ──
      const updatedProduct = {
        ...match,
        name: raw.name ?? match.name,
        description: raw.name ?? match.description,
        images: imagesStr !== "[]" ? imagesStr : match.images,
        brandId: COLSTON_BRAND_ID,
        brand_parentcategoriesId:
          match.brand_parentcategoriesId || BRAND_PARENT_CATEGORY_ID,
        meta: {
          ...match.meta,
          [KEY_INTERNAL_ID]: internalId,
          ...(raw[KEY_HSN] !== undefined ? { [KEY_HSN]: raw[KEY_HSN] } : {}),
          ...(raw[KEY_UNIT] !== undefined ? { [KEY_UNIT]: raw[KEY_UNIT] } : {}),
          ...(raw[KEY_PRICE] !== undefined
            ? { [KEY_PRICE]: raw[KEY_PRICE] }
            : {}),
          ...(raw.company_code !== undefined
            ? { [KEY_CODE]: raw.company_code }
            : {}),
        },
        updatedAt: now,
      };
      updated.push(updatedProduct);
    } else {
      // ── CREATE new product in backup format ──
      const newProduct = {
        productId: crypto.randomUUID(),
        name: raw.name,
        product_code: nextCode(),
        quantity: 0,
        masterProductId: null,
        isMaster: false,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
        discountType: null,
        alert_quantity: 1,
        tax: "0.00",
        description: raw.name,
        images: imagesStr,
        isFeatured: false,
        status: "active",
        brandId: COLSTON_BRAND_ID,
        categoryId: null,
        vendorId: null,
        brand_parentcategoriesId: BRAND_PARENT_CATEGORY_ID,
        meta: {
          [KEY_INTERNAL_ID]: internalId ?? null,
          [KEY_HSN]: raw[KEY_HSN] ?? null,
          [KEY_UNIT]: raw[KEY_UNIT] ?? null,
          [KEY_TYPE]: "Goods",
          [KEY_PRICE]: raw[KEY_PRICE] ?? null,
          [KEY_CODE]: raw.company_code ?? null,
        },
        createdAt: now,
        updatedAt: now,
      };
      created.push(newProduct);
    }
  }

  await fs.writeFile(OUTPUT_UPDATE_FILE, JSON.stringify(updated, null, 2));
  await fs.writeFile(OUTPUT_NEW_FILE, JSON.stringify(created, null, 2));

  console.log("\n" + "═".repeat(60));
  console.log(`Matched & updated : ${updated.length} -> ${OUTPUT_UPDATE_FILE}`);
  console.log(`New products      : ${created.length} -> ${OUTPUT_NEW_FILE}`);
  console.log("═".repeat(60));
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  if (err.stack) console.error(err.stack.split("\n").slice(1, 4).join("\n"));
  process.exit(1);
});
