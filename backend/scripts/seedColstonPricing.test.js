const { test } = require('node:test');
const assert = require('node:assert/strict');
const { seedPayloads } = require('./lib/seedColstonPricing');
const { KEYS } = require('./updateBrandPricing');
const directory = './json-outputs/colston-pricing-update-2026-11-05-colston2/';
const existing = require(directory + 'updated_existing_products.json');

test('updates existing products, preserves live stock/meta/images and logs commit', async () => {
  const rows = new Map(structuredClone(existing).map((p) => [p.productId, p]));
  const sample = existing[0];
  const current = rows.get(sample.productId);
  current.quantity = 999;
  current.meta = { ...current.meta, [KEYS.price]: -1, liveOnly: 'keep' };
  current.images = JSON.stringify(['https://example.com/live.jpg']);
  const qi = {
    sequelize: {
      async transaction(callback) {
        return callback({});
      },
      async query(sql, { replacements: args }) {
        if (args.id)
          return [
            [...rows.values()].filter(
              (p) => p.productId === args.id || p.product_code === args.code,
            ),
          ];
        return [[]];
      },
    },
    async bulkUpdate(table, values, where) {
      Object.assign(rows.get(where.productId), values);
    },
    async bulkInsert(table, values) {
      for (const p of values) rows.set(p.productId, structuredClone(p));
    },
  };
  const logs = [];
  const first = await seedPayloads(qi, existing, { log: (message) => logs.push(message) });
  assert.equal(first.processed, existing.length);
  assert.equal(rows.size, existing.length);
  assert.ok(logs.some((line) => line.includes('Progress 100/')));
  assert.ok(logs.at(-1).includes('Transaction committed'));
  assert.equal(rows.get(sample.productId).quantity, 999);
  const meta = JSON.parse(rows.get(sample.productId).meta);
  assert.equal(meta.liveOnly, 'keep');
  assert.equal(meta[KEYS.price], sample.meta[KEYS.price]);
  assert.deepEqual(JSON.parse(rows.get(sample.productId).images), ['https://example.com/live.jpg']);
  const second = await seedPayloads(qi, existing, { log: () => {} });
  assert.equal(second.updated, 0);
  assert.equal(second.unchanged, existing.length);
});

test('refuses changed product identities before updating them', async () => {
  const qi = {
    sequelize: {
      async transaction(callback) {
        return callback({});
      },
      async query() {
        return [[]];
      },
    },
  };
  await assert.rejects(
    seedPayloads(qi, existing, { log: () => {} }),
    /identity changed or missing/,
  );
});
