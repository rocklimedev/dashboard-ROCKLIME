const { test } = require('node:test');
const assert = require('node:assert/strict');
const { seedPayloads } = require('./lib/seedReconciledInventory');
const existing = require('./json-outputs/inventory-reconciliation/existing-products.json');
const fresh = require('./json-outputs/inventory-reconciliation/new-products.json');
const companyKey = 'd11da9f9-3f2e-4536-8236-9671200cca4a';
const clone = (value) => JSON.parse(JSON.stringify(value));
function database(initial) {
  let state = clone(initial);
  let working;
  const transactionToken = {};
  function check(options) { assert.equal(options.transaction, transactionToken); }
  const qi = {
    get rows() { return state; },
    sequelize: {
      async transaction(callback) {
        working = clone(state);
        const result = await callback(transactionToken);
        state = working;
        return result;
      },
      async query(sql, options) {
        check(options);
        assert.match(sql, /FOR UPDATE$/);
        const args = options.replacements;
        if (args.id) return [working.filter((p) => p.productId === args.id || p.product_code.toUpperCase() === args.code.toUpperCase())];
        return [working.filter((p) => {
          const meta = typeof p.meta === 'string' ? JSON.parse(p.meta) : p.meta;
          return p.brandId === args.brandId && String(meta[companyKey] ?? meta.companyCode).trim().toUpperCase() === args.companyCode;
        }).slice(0, 1)];
      },
    },
    async bulkUpdate(table, values, where, options) {
      check(options); assert.equal(table, 'products');
      Object.assign(working.find((p) => p.productId === where.productId), values);
    },
    async bulkInsert(table, values, options) {
      check(options); assert.equal(table, 'products'); working.push(...clone(values));
    },
  };
  return qi;
}
test('updates imported fields, preserves live stock/metadata, and inserts schema rows', async () => {
  const live = clone(existing[0]);
  live.quantity = 912;
  live.images = ['latest.png'];
  live.meta.liveOnly = 'preserve';
  live.meta.inventorySource = { page: 1 };
  const qi = database([live]);
  assert.deepEqual(await seedPayloads(qi, [existing[0]], [fresh[0]]), { updated: 1, inserted: 1, skipped: 0 });
  assert.equal(qi.rows[0].quantity, 912);
  assert.deepEqual(qi.rows[0].images, ['latest.png']);
  const meta = JSON.parse(qi.rows[0].meta);
  assert.equal(meta.liveOnly, 'preserve');
  assert.equal(Object.hasOwn(meta, 'inventorySource'), false);
  assert.equal(qi.rows[1].productId, fresh[0].productId);
  assert.deepEqual(JSON.parse(qi.rows[1].images), fresh[0].images);
  assert.equal(qi.rows[1].quantity, 0);
});
test('rerunning the same files skips previously inserted rows', async () => {
  const qi = database([]);
  await seedPayloads(qi, [], [fresh[0]]);
  qi.rows[0].quantity = 75;
  assert.deepEqual(await seedPayloads(qi, [], [fresh[0]]), { updated: 0, inserted: 0, skipped: 1 });
  assert.equal(qi.rows.length, 1);
  assert.equal(qi.rows[0].quantity, 75);
});
test('a new code collision rolls back earlier updates', async () => {
  const live = { ...clone(existing[0]), name: 'Before' };
  const collision = { ...clone(fresh[0]), productId: '11111111-1111-4111-8111-111111111111' };
  const qi = database([live, collision]);
  await assert.rejects(seedPayloads(qi, [existing[0]], [fresh[0]]), /conflict/);
  assert.equal(qi.rows[0].name, 'Before');
});
test('changed identities and late company-code duplicates are rejected', async () => {
  await assert.rejects(seedPayloads(database([]), [existing[0]], []), /missing/);
  const late = { ...clone(fresh[0]), productId: '11111111-1111-4111-8111-111111111111', product_code: 'OTHER' };
  await assert.rejects(seedPayloads(database([late]), [], [fresh[0]]), /Company code already exists/);
});
test('duplicate payloads fail before any database writes', async () => {
  const qi = database([]);
  await assert.rejects(seedPayloads(qi, [], [fresh[0], fresh[0]]), /Duplicate payload/);
  assert.equal(qi.rows.length, 0);
});
test('all generated rows can be imported using the transaction adapter', async () => {
  const qi = database(existing);
  assert.deepEqual(await seedPayloads(qi, existing, fresh), { updated: existing.length, inserted: fresh.length, skipped: 0 });
  assert.equal(qi.rows.length, existing.length + fresh.length);
});
