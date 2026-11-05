const fs = require('node:fs/promises');
const path = require('node:path');
const { BRAND_ID } = require('./updateBrandPricing');

const OUTPUT = path.join(__dirname, 'json-outputs', 'colston-image-folder');
function imagesOf(value) {
  const images = typeof value === 'string' ? JSON.parse(value) : value;
  if (images == null) return [];
  if (!Array.isArray(images) || images.some((image) => typeof image !== 'string'))
    throw new Error('Invalid product images');
  return images;
}
function renameImages(value) {
  return imagesOf(value).map((image) =>
    image.replace(
      /^https:\/\/media\.cmtradingco\.com\/product_images\/colston2\//,
      'https://media.cmtradingco.com/product_images/colston/',
    ),
  );
}
function prepare(products) {
  return products.flatMap((product) => {
    if (product.brandId !== BRAND_ID) throw new Error('Unexpected product brand');
    const before = imagesOf(product.images);
    const after = renameImages(product.images);
    return JSON.stringify(before) === JSON.stringify(after)
      ? []
      : [
          {
            productId: product.productId,
            product_code: product.product_code,
            brandId: product.brandId,
            beforeImages: before,
            images: after,
          },
        ];
  });
}
async function backup(sequelize, directory = OUTPUT) {
  const [products] = await sequelize.query(
    'SELECT * FROM products WHERE brandId = :brandId ORDER BY productId',
    {
      replacements: { brandId: BRAND_ID },
    },
  );
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(directory, stamp);
  await fs.mkdir(out, { recursive: true });
  const backupFile = path.join(out, 'colston_products_backup.json');
  await fs.writeFile(backupFile, JSON.stringify(products, null, 2) + '\n', { flag: 'wx' });
  console.log(`Backed up ${products.length} Colston products: ${backupFile}`);
  const updates = prepare(products);
  const updateFile = path.join(out, 'colston_image_updates.json');
  await fs.writeFile(updateFile, JSON.stringify(updates, null, 2) + '\n', { flag: 'wx' });
  console.log(`Prepared ${updates.length} image URL changes: ${updateFile}`);
  console.log(
    'Copy the corresponding CDN image files into /product_images/colston/ before seeding.',
  );
  console.log(`$env:COLSTON_IMAGE_UPDATES = '${updateFile}'`);
  return { products, updates, out };
}
async function seedPayloads(queryInterface, updates, log = console.log) {
  if (!Array.isArray(updates)) throw new Error('Expected image updates array');
  const ids = new Set();
  for (const p of updates) {
    if (!p.productId || !p.product_code || p.brandId !== BRAND_ID || ids.has(p.productId))
      throw new Error('Invalid or duplicate product identity');
    ids.add(p.productId);
    if (JSON.stringify(renameImages(p.beforeImages)) !== JSON.stringify(imagesOf(p.images)))
      throw new Error(`Invalid folder-only change: ${p.productId}`);
  }
  log(`Starting image-only transaction for ${updates.length} products.`);
  let processed = 0;
  try {
    const result = await queryInterface.sequelize.transaction(async (transaction) => {
      const counts = { updated: 0, unchanged: 0 };
      for (const p of updates) {
        const [rows] = await queryInterface.sequelize.query(
          'SELECT productId, product_code, brandId, images FROM products WHERE productId = :id FOR UPDATE',
          { replacements: { id: p.productId }, transaction },
        );
        const current = rows[0];
        if (
          rows.length !== 1 ||
          current.brandId !== BRAND_ID ||
          current.product_code !== p.product_code
        )
          throw new Error(`Product identity changed: ${p.productId}`);
        const images = JSON.stringify(imagesOf(current.images));
        if (images === JSON.stringify(p.images)) counts.unchanged++;
        else {
          if (images !== JSON.stringify(p.beforeImages))
            throw new Error(
              `Live images changed since backup: ${p.productId}. Create a new backup.`,
            );
          await queryInterface.bulkUpdate(
            'products',
            {
              images: JSON.stringify(p.images),
              updatedAt: new Date(),
            },
            { productId: p.productId },
            { transaction },
          );
          counts.updated++;
          log(`Updated ${p.product_code}: colston2 -> colston (pending commit).`);
        }
        processed++;
        if (processed % 50 === 0 || processed === updates.length)
          log(
            `Progress ${processed}/${updates.length}: ${counts.updated} updated, ${counts.unchanged} unchanged.`,
          );
      }
      log('Committing image changes...');
      return counts;
    });
    log(`Committed: ${result.updated} updated, ${result.unchanged} unchanged.`);
    return result;
  } catch (error) {
    log(`Transaction rolled back: ${error.message}`);
    throw error;
  }
}
async function main() {
  const { Sequelize } = require('sequelize');
  const config = require('../config/config');
  const environment = process.env.NODE_ENV || 'production';
  if (!config[environment]) throw new Error(`Unknown environment: ${environment}`);
  const sequelize = new Sequelize(config[environment]);
  try {
    console.log(`Reading Colston products from ${environment} database...`);
    await backup(sequelize);
  } finally {
    await sequelize.close();
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { backup, prepare, renameImages, seedPayloads };
