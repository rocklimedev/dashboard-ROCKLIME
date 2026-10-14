// Run: node backend/scripts/reconcileAmProducts.js [input-directory] [output-directory]
// Generates files only; does not connect to or modify the database.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const BRAND_ID = "4e3acf32-1e47-4d38-a6bb-417addd52ac0";
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
const normalize = (value) => clean(value).toUpperCase();

function description(row) {
  const type = clean(row.product_type);
  const collection = clean(row.collection);
  const category = clean(row.category);
  const finish = clean(row.finish);
  return (
    [
      type && collection
        ? `${type} from the ${collection} collection.`
        : collection
          ? `From the ${collection} collection.`
          : type
            ? `${type}.`
            : "",
      category ? `Category: ${category}.` : "",
      finish ? `Finished in ${finish}.` : "",
    ]
      .filter(Boolean)
      .join(" ") || clean(row.product_name)
  );
}

function reconcile(master, source, timestamp = new Date().toISOString()) {
  if (!Array.isArray(master) || !Array.isArray(source))
    throw new Error("Expected product arrays");
  const index = new Map();
  const parentIds = new Set(master.filter(p => p.brandId === BRAND_ID).map(p => p.brand_parentcategoriesId).filter(Boolean));
  const brandParentId = parentIds.size === 1 ? [...parentIds][0] : null;
  const internalCodes = new Set(master.map((p) => normalize(p.product_code)));
  let sequence = Math.max(
    0,
    ...master.map((p) =>
      /^EAMAM\d+$/.test(p.product_code) ? Number(p.product_code.slice(5)) : 0,
    ),
  );
  for (const product of master) {
    if (product.brandId !== BRAND_ID) continue;
    const meta =
      typeof product.meta === "string"
        ? JSON.parse(product.meta)
        : product.meta;
    const codes = new Set(
      [meta?.[COMPANY_CODE_KEY], meta?.companyCode, meta?.company_code, meta?.companycode, product.companyCode, product.company_code, product.companycode]
        .map(normalize)
        .filter(Boolean),
    );
    if (codes.size > 1)
      throw new Error(`Conflicting company codes on ${product.productId}`);
    // A catalogue code may be stored as either company code or product_code.
    codes.add(normalize(product.product_code));
    codes.delete("");
    for (const code of codes)
      index.set(code, [...(index.get(code) || []), product]);
  }
  const corrected = [],
    added = [],
    duplicates = [],
    seen = new Set(),
    matchedIds = new Set();
  for (const row of source) {
    const code = normalize(row.product_code);
    if (!code || !clean(row.product_name))
      throw new Error("Source product must have a code and name");
    if (seen.has(code))
      throw new Error(`Duplicate source company code: ${code}`);
    if (normalize(row.brand) !== "AMERICAN STANDARD")
      throw new Error(`Unexpected brand for ${code}`);
    seen.add(code);
    const matches = index.get(code) || [];
    const images = clean(row.image_path)
      ? JSON.stringify([clean(row.image_path)])
      : null;
    if (matches.length) {
      if (matches.length > 1)
        duplicates.push({
          company_code: code,
          productIds: matches.map((p) => p.productId),
        });
      for (const product of matches) {
        if (matchedIds.has(product.productId)) throw new Error(`Multiple source codes match master product ${product.productId}`);
        matchedIds.add(product.productId);
        corrected.push({
          ...product,
          name: clean(row.product_name),
          description: description(row),
          ...(images
            ? {
                images:
                  typeof product.images === "string"
                    ? images
                    : JSON.parse(images),
              }
            : {}),
        });
      }
    } else {
      let internalCode;
      do {
        internalCode = `EAMAM${String(++sequence).padStart(7, "0")}`;
      } while (internalCodes.has(normalize(internalCode)));
      internalCodes.add(normalize(internalCode));
      // Stable UUID for repeatable output; version 5 bits with a SHA-1 identity hash.
      const hash = crypto
        .createHash("sha1")
        .update(`${BRAND_ID}:${code}`)
        .digest()
        .subarray(0, 16);
      hash[6] = (hash[6] & 15) | 80;
      hash[8] = (hash[8] & 63) | 128;
      const hex = hash.toString("hex");
      added.push({
        productId: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
        name: clean(row.product_name),
        product_code: internalCode,
        quantity: 0,
        masterProductId: null,
        isMaster: false,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
        discountType: null,
        alert_quantity: 1,
        tax: "0.00",
        description: description(row),
        images: images || "[]",
        isFeatured: false,
        status: "active",
        brandId: BRAND_ID,
        categoryId: null,
        vendorId: null,
        brand_parentcategoriesId: brandParentId,
        meta: { [COMPANY_CODE_KEY]: clean(row.product_code) },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
  return { corrected, added, duplicates };
}

if (require.main === module) {
  const input = path.resolve(
    process.argv[2] || path.join(__dirname, "json-outputs"),
  );
  const output = path.resolve(process.argv[3] || input);
  const read = (name) =>
    JSON.parse(
      fs.readFileSync(path.join(input, name), "utf8").replace(/^\uFEFF/, ""),
    );
  const master = read("products_backup.json");
  const source = read("as_product_data.json");
  const result = reconcile(
    master,
    Array.isArray(source) ? source : source.products,
  );
  fs.mkdirSync(output, { recursive: true });
  for (const [name, rows] of [
    ["corrected_am.json", result.corrected],
    ["new_am.json", result.added],
  ]) {
    fs.writeFileSync(
      path.join(output, name),
      JSON.stringify(rows, null, 2) + "\n",
    );
  }
  console.log(
    JSON.stringify(
      {
        correctedRecords: result.corrected.length,
        newProducts: result.added.length,
        duplicateMasterCodes: result.duplicates,
      },
      null,
      2,
    ),
  );
}

module.exports = { reconcile, description, BRAND_ID, COMPANY_CODE_KEY };
