const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepare, seedPayloads } = require('./colstonImageFolder');
const { BRAND_ID } = require('./updateBrandPricing');
const original = {
  productId: 'id',
  product_code: 'CODE',
  brandId: BRAND_ID,
  quantity: 99,
  images: JSON.stringify([
    'https://media.cmtradingco.com/product_images/colston2/a.jpg',
    'https://example.com/colston2/b.png',
  ]),
};
test('changes only matching CDN folder; preserves live stock and reruns without updates', async () => {
  const updates = prepare([original]);
  assert.deepEqual(updates[0].images, [
    'https://media.cmtradingco.com/product_images/colston/a.jpg',
    'https://example.com/colston2/b.png',
  ]);
  const row = structuredClone(original);
  const qi = {
    sequelize: {
      async transaction(fn) {
        return fn({});
      },
      async query() {
        return [[row]];
      },
    },
    async bulkUpdate(table, values) {
      assert.deepEqual(Object.keys(values).sort(), ['images', 'updatedAt']);
      Object.assign(row, values);
    },
  };
  assert.deepEqual(await seedPayloads(qi, updates, () => {}), { updated: 1, unchanged: 0 });
  assert.equal(row.quantity, 99);
  assert.deepEqual(await seedPayloads(qi, updates, () => {}), { updated: 0, unchanged: 1 });
  row.images = '[]';
  await assert.rejects(
    seedPayloads(qi, updates, () => {}),
    /Live images changed/,
  );
});

test('rejects payload changes beyond the requested folder', async () => {
  const updates = prepare([original]);
  updates[0].images = ['https://example.com/replacement.jpg'];
  await assert.rejects(
    seedPayloads({}, updates, () => {}),
    /Invalid folder-only change/,
  );
});
