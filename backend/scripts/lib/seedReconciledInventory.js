const fs = require("node:fs/promises");
const path = require("node:path");

const BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";
const META_KEYS = [
  "d11da9f9-3f2e-4536-8236-9671200cca4a",
  "9ba862ef-f993-4873-95ef-1fef10036aa5",
  "b9e1df45-113d-11f1-b773-52540021303b",
];
const COLUMNS = [
  "productId",
  "name",
  "product_code",
  "quantity",
  "discountType",
  "alert_quantity",
  "tax",
  "description",
  "images",
  "brandId",
  "categoryId",
  "createdAt",
  "updatedAt",
  "isFeatured",
  "status",
  "vendorId",
  "brand_parentcategoriesId",
  "meta",
  "masterProductId",
  "isMaster",
  "variantOptions",
  "variantKey",
  "skuSuffix",
];
const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();
function objectMeta(value) {
  const parsed =
    typeof value === "string" ? (value.trim() ? JSON.parse(value) : {}) : value;
  if (parsed == null) return {};
  if (typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Product meta must be an object");
  return parsed;
}
function validatePayloads(existing, fresh) {
  if (!Array.isArray(existing) || !Array.isArray(fresh))
    throw new Error("Product files must contain arrays");
  const ids = new Set(),
    codes = new Set(),
    companyCodes = new Set();
  for (const product of [...existing, ...fresh]) {
    if (
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
        product.productId || "",
      )
    )
      throw new Error("Invalid productId");
    if (product.brandId !== BRAND_ID)
      throw new Error(`Unexpected brand for ${product.productId}`);
    if (
      !product.name?.trim() ||
      product.name.length > 255 ||
      !product.product_code?.trim() ||
      product.product_code.length > 255
    )
      throw new Error(`Invalid name/code for ${product.productId}`);
    const meta = objectMeta(product.meta);
    const companyCode = normalize(meta[META_KEYS[0]]);
    if (!companyCode)
      throw new Error(`Missing company code for ${product.productId}`);
    if (
      ids.has(product.productId) ||
      codes.has(normalize(product.product_code)) ||
      companyCodes.has(companyCode)
    )
      throw new Error(`Duplicate payload identity for ${product.productId}`);
    ids.add(product.productId);
    codes.add(normalize(product.product_code));
    companyCodes.add(companyCode);
  }
}
function insertRow(product) {
  const row = {};
  for (const column of COLUMNS) {
    if (product[column] === undefined)
      throw new Error(`Missing ${column} for new product ${product.productId}`);
    row[column] = product[column];
  }
  row.meta = { ...objectMeta(row.meta) };
  delete row.meta.inventorySource;
  for (const column of ["meta", "images", "variantOptions"]) {
    if (row[column] != null) {
      const value =
        typeof row[column] === "string" ? JSON.parse(row[column]) : row[column];
      row[column] = JSON.stringify(value);
    }
  }
  for (const column of ["createdAt", "updatedAt"]) {
    row[column] = new Date(row[column]);
    if (Number.isNaN(row[column].getTime()))
      throw new Error(`Invalid ${column} for ${row.productId}`);
  }
  return row;
}

async function seedPayloads(queryInterface, existing, fresh) {
  validatePayloads(existing, fresh);
  // Validate inserts before opening the transaction or applying any update.
  const inserts = fresh.map(insertRow);
  const sequelize = queryInterface.sequelize;
  return sequelize.transaction(async (transaction) => {
    const options = { transaction };
    let updated = 0,
      inserted = 0,
      skipped = 0;
    async function findIdentity(product) {
      const [rows] = await sequelize.query(
        "SELECT productId, product_code, brandId, meta FROM products WHERE productId = :id OR product_code = :code FOR UPDATE",
        {
          ...options,
          replacements: { id: product.productId, code: product.product_code },
        },
      );
      return rows;
    }
    function sameIdentity(current, product) {
      const meta = objectMeta(current.meta);
      return (
        current.productId === product.productId &&
        normalize(current.product_code) === normalize(product.product_code) &&
        current.brandId === BRAND_ID &&
        normalize(meta[META_KEYS[0]] ?? meta.companyCode) ===
          normalize(objectMeta(product.meta)[META_KEYS[0]])
      );
    }
    for (const product of existing) {
      const rows = await findIdentity(product);
      if (rows.length !== 1 || !sameIdentity(rows[0], product))
        throw new Error(
          `Existing product identity changed or missing: ${product.productId}. Reconcile again.`,
        );
      // Merge only imported metadata into the live row, preserving later edits.
      const meta = { ...objectMeta(rows[0].meta) };
      const importedMeta = objectMeta(product.meta);
      for (const key of META_KEYS)
        if (Object.hasOwn(importedMeta, key)) meta[key] = importedMeta[key];
      delete meta.inventorySource;
      await queryInterface.bulkUpdate(
        "products",
        {
          name: product.name,
          description: product.description,
          meta: JSON.stringify(meta),
          updatedAt: new Date(),
        },
        { productId: product.productId },
        options,
      );
      updated++;
    }
    for (let index = 0; index < fresh.length; index++) {
      const product = fresh[index];
      const rows = await findIdentity(product);
      if (rows.length) {
        if (rows.length !== 1 || !sameIdentity(rows[0], product))
          throw new Error(
            `New product ID/code conflict: ${product.productId}. Reconcile again.`,
          );
        skipped++;
        continue;
      }
      // Detect a product added since reconciliation under a different internal code.
      const companyCode = normalize(objectMeta(product.meta)[META_KEYS[0]]);
      const [companyMatches] = await sequelize.query(
        "SELECT productId FROM products WHERE brandId = :brandId AND (UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(meta, :metaPath)))) = :companyCode OR UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.companyCode')))) = :companyCode) LIMIT 1 FOR UPDATE",
        {
          ...options,
          replacements: {
            brandId: BRAND_ID,
            metaPath: `$."${META_KEYS[0]}"`,
            companyCode,
          },
        },
      );
      if (companyMatches.length)
        throw new Error(
          `Company code already exists: ${companyCode}. Reconcile again.`,
        );
      await queryInterface.bulkInsert("products", [inserts[index]], options);
      inserted++;
    }
    return { updated, inserted, skipped };
  });
}

async function seedFiles(queryInterface) {
  const directory = path.resolve(
    process.env.INVENTORY_RECONCILIATION_DIR ||
      path.join(__dirname, "..", "json-outputs", "inventory-reconciliation"),
  );
  const [existing, fresh] = await Promise.all(
    ["existing-products.json", "new-products.json"].map(async (filename) => {
      const file = path.join(directory, filename);
      try {
        return JSON.parse(await fs.readFile(file, "utf8"));
      } catch (error) {
        throw new Error(`Cannot read ${file}: ${error.message}`);
      }
    }),
  );
  const result = await seedPayloads(queryInterface, existing, fresh);
  console.log(
    `Colston inventory seeded: ${result.updated} updated, ${result.inserted} inserted, ${result.skipped} already seeded. Review rows were not imported.`,
  );
  return result;
}
module.exports = { seedFiles, seedPayloads };
