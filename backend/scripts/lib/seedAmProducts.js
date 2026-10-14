const fs = require("node:fs/promises");
const path = require("node:path");
const { BRAND_ID, COMPANY_CODE_KEY } = require("../reconcileAmProducts");
const normalize = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
const COLUMNS =
  "productId name product_code quantity masterProductId isMaster variantOptions variantKey skuSuffix discountType alert_quantity tax description images isFeatured status brandId categoryId vendorId brand_parentcategoriesId meta createdAt updatedAt".split(
    " ",
  );
function parse(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}
function companyCode(product) {
  const meta = parse(product.meta) ?? {};
  if (!meta || typeof meta !== "object" || Array.isArray(meta))
    throw new Error("Invalid product metadata");
  const codes = new Set(
    [meta[COMPANY_CODE_KEY], meta.companyCode, meta.company_code, meta.companycode, product.companyCode, product.company_code, product.companycode]
      .map(normalize)
      .filter(Boolean),
  );
  if (codes.size > 1)
    throw new Error(`Missing/conflicting company code: ${product.productId}`);
  const code = [...codes][0] || normalize(product.product_code);
  if (!code) throw new Error(`Missing company/product code: ${product.productId}`);
  return code;
}
function validate(existing, fresh) {
  if (!Array.isArray(existing) || !Array.isArray(fresh))
    throw new Error("Expected JSON product arrays");
  const ids = new Set(),
    internal = new Set(),
    existingCompanies = new Set(),
    newCompanies = new Set();
  for (const p of [...existing, ...fresh]) {
    if (
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(p.productId || "")
    )
      throw new Error("Invalid productId");
    if (p.brandId !== BRAND_ID)
      throw new Error(`Unexpected brand: ${p.productId}`);
    if (
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 255 ||
      typeof p.product_code !== "string" ||
      !p.product_code.trim() ||
      p.product_code.length > 255
    )
      throw new Error("Invalid name/internal code");
    if (
      ids.has(normalize(p.productId)) ||
      internal.has(normalize(p.product_code))
    )
      throw new Error("Duplicate payload identity");
    ids.add(normalize(p.productId));
    internal.add(normalize(p.product_code));
    companyCode(p);
    if (typeof p.description !== "string")
      throw new Error("Invalid description");
    const images = parse(p.images);
    if (
      !Array.isArray(images) ||
      images.some((image) => typeof image !== "string")
    )
      throw new Error("Invalid images");
  }
  for (const p of existing) existingCompanies.add(companyCode(p));
  for (const p of fresh) {
    const code = companyCode(p);
    if (existingCompanies.has(code) || newCompanies.has(code))
      throw new Error("Duplicate new company code");
    newCompanies.add(code);
  }
}
function insertRow(product) {
  const row = {};
  for (const key of COLUMNS) {
    if (product[key] === undefined)
      throw new Error(`Missing new product field: ${key}`);
    row[key] = product[key];
  }
  for (const key of ["images", "meta", "variantOptions"])
    if (row[key] !== null) row[key] = JSON.stringify(parse(row[key]));
  for (const key of ["createdAt", "updatedAt"]) {
    row[key] = new Date(row[key]);
    if (!product[key] || Number.isNaN(row[key].getTime()))
      throw new Error(`Invalid ${key}`);
  }
  return row;
}
async function seedPayloads(queryInterface, existing, fresh) {
  validate(existing, fresh);
  const inserts = fresh.map(insertRow);
  const sequelize = queryInterface.sequelize;
  return sequelize.transaction(async (transaction) => {
    const options = { transaction };
    const result = { updated: 0, inserted: 0, skipped: 0 };
    async function findIdentity(p) {
      const [rows] = await sequelize.query(
        "SELECT productId, product_code, brandId, meta FROM products WHERE productId = :id OR product_code = :code FOR UPDATE",
        {
          ...options,
          replacements: { id: p.productId, code: p.product_code },
        },
      );
      return rows;
    }
    function sameIdentity(current, p) {
      return (
        normalize(current.productId) === normalize(p.productId) &&
        normalize(current.product_code) === normalize(p.product_code) &&
        current.brandId === BRAND_ID &&
        companyCode(current) === companyCode(p)
      );
    }
    for (const p of existing) {
      const rows = await findIdentity(p);
      if (rows.length !== 1 || !sameIdentity(rows[0], p))
        throw new Error(
          `Existing product identity changed or missing: ${p.productId}`,
        );
      // Only catalogue fields are updated; live stock, prices, metadata and relationships are preserved.
      await queryInterface.bulkUpdate(
        "products",
        {
          name: p.name,
          description: p.description,
          images: JSON.stringify(parse(p.images)),
          updatedAt: new Date(),
        },
        { productId: p.productId },
        options,
      );
      result.updated++;
    }
    for (let i = 0; i < fresh.length; i++) {
      const p = fresh[i],
        rows = await findIdentity(p);
      if (rows.length) {
        if (rows.length !== 1 || !sameIdentity(rows[0], p))
          throw new Error(`New product ID/code conflict: ${p.productId}`);
        result.skipped++;
        continue;
      }
      const [matches] = await sequelize.query(
        "SELECT productId FROM products WHERE brandId = :brandId AND (UPPER(TRIM(product_code)) = :companyCode OR UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(meta, :metaPath)))) = :companyCode OR UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.companyCode')))) = :companyCode OR UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.company_code')))) = :companyCode OR UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.companycode')))) = :companyCode) LIMIT 1 FOR UPDATE",
        {
          ...options,
          replacements: {
            brandId: BRAND_ID,
            metaPath: `$."${COMPANY_CODE_KEY}"`,
            companyCode: companyCode(p),
          },
        },
      );
      if (matches.length)
        throw new Error(
          `Company code already exists: ${companyCode(p)}. Reconcile again.`,
        );
      await queryInterface.bulkInsert("products", [inserts[i]], options);
      result.inserted++;
    }
    return result;
  });
}
async function seedFiles(queryInterface) {
  const directory = path.resolve(
    process.env.AM_PRODUCTS_DIR || path.join(__dirname, "..", "json-outputs"),
  );
  const [existing, fresh] = await Promise.all(
    ["corrected_am.json", "new_am.json"].map(async (name) =>
      JSON.parse(
        (await fs.readFile(path.join(directory, name), "utf8")).replace(
          /^\uFEFF/,
          "",
        ),
      ),
    ),
  );
  const result = await seedPayloads(queryInterface, existing, fresh);
  console.log(
    `AM products seeded: ${result.updated} updated, ${result.inserted} inserted, ${result.skipped} already seeded.`,
  );
  return result;
}
module.exports = { seedPayloads, seedFiles };
