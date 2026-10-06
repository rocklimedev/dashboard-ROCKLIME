const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";
const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();
const present = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";
function jsonValue(value, fallback, context) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text || text === "null") return fallback;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${context}: ${error.message}`);
  }
}

async function readJsonFile(filename) {
  const text = (await fs.readFile(filename, "utf8")).replace(/^\uFEFF/, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON file ${filename}: ${error.message}`);
  }
}

// Pure reconciliation: no database writes, and no name/fuzzy matching.
function reconcile(inventory, snapshot, now = new Date().toISOString()) {
  if (!Array.isArray(inventory) || !Array.isArray(snapshot.products)) {
    throw new Error("Inventory and snapshot.products must be arrays");
  }
  if (!snapshot.brands?.some((brand) => brand.id === BRAND_ID)) {
    throw new Error("Colston brand is missing from the database snapshot");
  }
  const fields = Object.fromEntries(
    (snapshot.productMetas || []).map((field) => [field.slug, field]),
  );
  for (const [slug, type] of [
    ["companyCode", "string"],
    ["sellingPrice", "number"],
    ["color_name", "string"],
  ]) {
    if (!fields[slug] || fields[slug].fieldType !== type)
      throw new Error(`Missing or incompatible product metadata: ${slug}`);
  }
  const products = snapshot.products.map((product) => ({
    ...product,
    meta: jsonValue(product.meta, {}, `products.${product.productId}.meta`),
    images: jsonValue(product.images, null, `products.${product.productId}.images`),
    variantOptions: jsonValue(product.variantOptions, null, `products.${product.productId}.variantOptions`),
  }));
  for (const product of products) {
    if (
      !product.meta ||
      typeof product.meta !== "object" ||
      Array.isArray(product.meta)
    ) {
      throw new Error(
        `Invalid metadata object for product ${product.productId}`,
      );
    }
  }
  const byCode = new Map();
  for (const product of products.filter((p) => p.brandId === BRAND_ID)) {
    // Some older imports use slug keys; current API uses UUID keys.
    const code = normalize(
      product.meta[fields.companyCode.id] ?? product.meta.companyCode,
    );
    if (code) byCode.set(code, [...(byCode.get(code) || []), product]);
  }
  const counts = new Map();
  for (const row of inventory) {
    const code = normalize(row.company_code);
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  const usedCodes = new Set(products.map((p) => normalize(p.product_code)));
  let sequence = products.reduce((max, p) => {
    const match = normalize(p.product_code).match(/^ECLCO(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  function nextCode() {
    let code;
    do {
      code = `ECLCO${String(++sequence).padStart(8, "0")}`;
    } while (usedCodes.has(code));
    usedCodes.add(code);
    return code;
  }
  const existing = [],
    fresh = [],
    review = [];
  inventory.forEach((row, index) => {
    const code = normalize(row.company_code);
    const matches = byCode.get(code) || [];
    let reason;
    if (!code) reason = "missing_company_code";
    else if (counts.get(code) > 1) reason = "duplicate_inventory_company_code";
    else if (matches.length > 1) reason = "ambiguous_database_company_code";
    else if (!present(row.name) || String(row.name).length > 255)
      reason = "invalid_name";
    else if (typeof row.company_code !== "string" || code.length > 255)
      reason = "invalid_company_code";
    else if (
      present(row.selling_price) &&
      (typeof row.selling_price !== "number" ||
        !Number.isFinite(row.selling_price) ||
        row.selling_price < 0)
    )
      reason = "invalid_selling_price";
    if (reason) {
      review.push({
        row: index + 1,
        reason,
        matchedProductIds: matches.map((p) => p.productId),
        source: row,
      });
      return;
    }
    const match = matches[0];
    const product = match
      ? { ...match, meta: { ...match.meta } }
      : {
          productId: randomUUID(),
          name: String(row.name).trim(),
          product_code: nextCode(),
          quantity: 0,
          discountType: null,
          alert_quantity: null,
          tax: null,
          description: null,
          images: [],
          brandId: BRAND_ID,
          categoryId: null,
          createdAt: now,
          updatedAt: now,
          isFeatured: false,
          status: "active",
          vendorId: null,
          brand_parentcategoriesId: null,
          meta: {},
          masterProductId: null,
          isMaster: false,
          variantOptions: null,
          variantKey: null,
          skuSuffix: null,
        };
    product.name = String(row.name).trim();
    if (present(row.description)) product.description = String(row.description);
    product.meta[fields.companyCode.id] = String(row.company_code).trim();
    if (present(row.selling_price))
      product.meta[fields.sellingPrice.id] = row.selling_price;
    if (present(row.color))
      product.meta[fields.color_name.id] = String(row.color).trim();
    // Exclude source-only provenance from upload payloads, including legacy copies.
    delete product.meta.inventorySource;
    delete product.inventorySource;
    product.updatedAt = now;
    (match ? existing : fresh).push(product);
  });
  return {
    existing,
    fresh,
    review,
    summary: {
      inventoryRows: inventory.length,
      databaseProducts: products.length,
      existingProducts: existing.length,
      newProducts: fresh.length,
      reviewRows: review.length,
    },
  };
}

async function pullSnapshot() {
  // Avoid config/database.js and models: importing them starts connection retries
  // and may initialize application associations. This connection only SELECTs.
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  const mysql = require("mysql2/promise");
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 15000,
    },
  );
  try {
    await connection.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await connection.query(
      "START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY",
    );
    const [products] = await connection.query("SELECT * FROM products");
    const [brands] = await connection.query(
      "SELECT id, brandName, brandSlug FROM brands",
    );
    const [productMetas] = await connection.query(
      "SELECT id, slug, fieldType FROM product_metas",
    );
    await connection.commit();
    return {
      exportedAt: new Date().toISOString(),
      products,
      brands,
      productMetas,
    };
  } finally {
    await connection.end();
  }
}

async function main(args = process.argv.slice(2)) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help") {
      console.log(
        "Usage: node scripts/reconcileInventory.js [--input inventory.json] [--output directory] [--snapshot database-snapshot.json]",
      );
      return;
    }
    if (
      !["--input", "--output", "--snapshot"].includes(args[i]) ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    ) {
      throw new Error(`Invalid argument: ${args[i]}`);
    }
    options[args[i].slice(2)] = path.resolve(args[++i]);
  }
  const input =
    options.input || path.join(__dirname, "json-outputs", "inventory.json");
  const output =
    options.output ||
    path.join(__dirname, "json-outputs", "inventory-reconciliation");
  // Read and validate input before opening a DB connection.
  const inventory = await readJsonFile(input);
  if (!Array.isArray(inventory))
    throw new Error("Inventory must be a JSON array");
  const snapshot = options.snapshot
    ? await readJsonFile(options.snapshot)
    : await pullSnapshot();
  const result = reconcile(inventory, snapshot);
  await fs.mkdir(output, { recursive: true });
  for (const [filename, data] of [
    ["database-snapshot.json", snapshot],
    ["existing-products.json", result.existing],
    ["new-products.json", result.fresh],
    ["review-required.json", result.review],
    ["summary.json", result.summary],
  ]) {
    await fs.writeFile(
      path.join(output, filename),
      JSON.stringify(data, null, 2) + "\n",
    );
  }
  console.log(JSON.stringify(result.summary, null, 2));
  console.log(
    `JSON files saved to ${output}. No database records were changed.`,
  );
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { reconcile, pullSnapshot };
