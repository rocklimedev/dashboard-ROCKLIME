const fs = require('node:fs/promises');
const path = require('node:path');
const { BRAND_ID, KEYS } = require('../updateBrandPricing');
const COMPANY_CODE_KEY = KEYS.code;
const normalize = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
function parse(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}
function companyCode(product) {
  const meta = parse(product.meta) ?? {};
  if (!meta || typeof meta !== 'object' || Array.isArray(meta))
    throw new Error('Invalid product metadata');
  const codes = new Set(
    [
      meta[COMPANY_CODE_KEY],
      meta.companyCode,
      meta.company_code,
      meta.companycode,
      product.companyCode,
      product.company_code,
      product.companycode,
    ]
      .map(normalize)
      .filter(Boolean),
  );
  if (codes.size > 1) throw new Error(`Missing/conflicting company code: ${product.productId}`);
  const code = [...codes][0] || normalize(product.product_code);
  if (!code) throw new Error(`Missing company/product code: ${product.productId}`);
  return code;
}
function validate(existing) {
  if (!Array.isArray(existing)) throw new Error('Expected JSON product arrays');
  const ids = new Set(),
    internal = new Set();
  for (const p of existing) {
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(p.productId || ''))
      throw new Error('Invalid productId');
    if (p.brandId !== BRAND_ID) throw new Error(`Unexpected brand: ${p.productId}`);
    if (
      typeof p.name !== 'string' ||
      !p.name.trim() ||
      p.name.length > 255 ||
      typeof p.product_code !== 'string' ||
      !p.product_code.trim() ||
      p.product_code.length > 255
    )
      throw new Error('Invalid name/internal code');
    if (ids.has(normalize(p.productId)) || internal.has(normalize(p.product_code)))
      throw new Error('Duplicate payload identity');
    ids.add(normalize(p.productId));
    internal.add(normalize(p.product_code));
    companyCode(p);
    if (typeof p.description !== 'string') throw new Error('Invalid description');
    const images = parse(p.images) || [];
    if (!Array.isArray(images) || images.some((image) => typeof image !== 'string'))
      throw new Error('Invalid images');
  }
}
async function seedPayloads(queryInterface, existing, { log = console.log } = {}) {
  validate(existing);
  const sequelize = queryInterface.sequelize;
  const started = Date.now();
  log('Starting transaction: ' + existing.length + ' existing products to check.');
  try {
    const committed = await sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const result = { updated: 0, unchanged: 0, processed: 0 };
      function progress(p) {
        if (result.processed % 100 === 0 || result.processed === existing.length)
          log(
            'Progress ' +
              result.processed +
              '/' +
              existing.length +
              ': ' +
              result.updated +
              ' updated, ' +
              result.unchanged +
              ' unchanged; last: ' +
              p.product_code +
              '; elapsed ' +
              ((Date.now() - started) / 1000).toFixed(1) +
              's (pending commit).',
          );
      }
      async function findIdentity(p) {
        const [rows] = await sequelize.query(
          'SELECT * FROM products WHERE productId = :id OR product_code = :code FOR UPDATE',
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
        if (result.processed % 100 === 0)
          log('Checking ' + (result.processed + 1) + '/' + existing.length + ': ' + p.product_code);
        const rows = await findIdentity(p);
        if (rows.length !== 1 || !sameIdentity(rows[0], p))
          throw new Error(`Existing product identity changed or missing: ${p.productId}`);
        const current = rows[0];
        const values = {};
        const meta = { ...(parse(current.meta) || {}) };
        const incomingMeta = parse(p.meta);
        let metaChanged = false;
        for (const key of Object.values(KEYS)) {
          if (
            Object.hasOwn(incomingMeta, key) &&
            JSON.stringify(meta[key]) !== JSON.stringify(incomingMeta[key])
          ) {
            meta[key] = incomingMeta[key];
            metaChanged = true;
          }
        }
        if (current.name !== p.name) values.name = p.name;
        if (
          (!current.description || current.description === current.name) &&
          current.description !== p.description
        )
          values.description = p.description;
        const images = parse(current.images) || [];
        const incomingImages = parse(p.images) || [];
        if (!Array.isArray(images)) throw new Error('Invalid live images: ' + p.productId);
        if (!images.some(Boolean) && incomingImages.some(Boolean))
          values.images = JSON.stringify(incomingImages);
        if (metaChanged) values.meta = JSON.stringify(meta);
        result.processed++;
        if (!Object.keys(values).length) {
          result.unchanged++;
          progress(p);
          continue;
        }
        const fields = Object.keys(values);
        values.updatedAt = new Date();
        await queryInterface.bulkUpdate('products', values, { productId: p.productId }, options);
        result.updated++;
        log(
          'Updated ' +
            p.product_code +
            ' (' +
            p.productId +
            '): ' +
            fields.join(', ') +
            ' (pending commit).',
        );
        progress(p);
      }
      log('All products checked; committing transaction...');
      return result;
    });
    log(
      'Transaction committed: ' +
        committed.updated +
        ' updated, ' +
        committed.unchanged +
        ' unchanged in ' +
        ((Date.now() - started) / 1000).toFixed(1) +
        's.',
    );
    return committed;
  } catch (error) {
    log('Import failed; transaction rolled back: ' + error.message);
    throw error;
  }
}
async function seedFiles(queryInterface) {
  const directory = path.resolve(
    process.env.COLSTON_PRICING_DIR ||
      path.join(__dirname, '..', 'json-outputs', 'colston-pricing-update-2026-11-05-colston2'),
  );
  const filename = path.join(directory, 'updated_existing_products.json');
  console.log('Reading ' + filename);
  const existing = JSON.parse((await fs.readFile(filename, 'utf8')).replace(/^\uFEFF/, ''));
  console.log('Loaded ' + existing.length + ' existing products.');
  const result = await seedPayloads(queryInterface, existing);
  return result;
}
module.exports = { seedPayloads, seedFiles };
