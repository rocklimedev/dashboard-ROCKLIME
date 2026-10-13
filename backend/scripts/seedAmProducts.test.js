const { test } = require('node:test');
const assert = require('node:assert/strict');
const { seedPayloads } = require('./lib/seedAmProducts');
const existing = require('./json-outputs/corrected_am.json');
const fresh = require('./json-outputs/new_am.json');
const { COMPANY_CODE_KEY } = require('./reconcileAmProducts');
const clone = value => JSON.parse(JSON.stringify(value));
const { reconcile } = require('./reconcileAmProducts');
test('backup product_code and company-code aliases classify products as existing', () => {
  const source = { product_code: ' catalogue-001 ', product_name: 'Updated', brand: 'American Standard' };
  for (const product of [
    { ...existing[0], product_code: 'CATALOGUE-001', meta: {} },
    { ...existing[0], companycode: 'CATALOGUE-001', meta: {} },
    { ...existing[0], meta: { companyCode: 'CATALOGUE-001' } },
    { ...existing[0], meta: JSON.stringify({ [COMPANY_CODE_KEY]: 'CATALOGUE-001' }) },
  ]) {
    const result = reconcile([product], [source]);
    assert.equal(result.added.length, 0);
    assert.equal(result.corrected.length, 1);
    assert.equal(result.corrected[0].productId, product.productId);
    assert.equal(result.corrected[0].product_code, product.product_code);
  }
});
function database(initial) {
  let state = clone(initial), working;
  const token = {};
  const check = options => assert.equal(options.transaction, token);
  return {
    get rows() { return state; },
    sequelize: {
      async transaction(callback) {
        working = clone(state);
        const result = await callback(token);
        state = working;
        return result;
      },
      async query(sql, options) {
        check(options); assert.match(sql, /FOR UPDATE$/);
        const args = options.replacements;
        if (args.id) return [working.filter(p => p.productId === args.id || p.product_code.toUpperCase() === args.code.toUpperCase())];
        return [working.filter(p => {
          const meta = typeof p.meta === 'string' ? JSON.parse(p.meta) : p.meta;
          assert.match(sql, /UPPER\(TRIM\(product_code\)\) = :companyCode/);
          return p.brandId === args.brandId && [p.product_code, meta[COMPANY_CODE_KEY], meta.companyCode, meta.company_code, meta.companycode].some(value => String(value ?? '').trim().toUpperCase() === args.companyCode);
        }).slice(0, 1)];
      },
    },
    async bulkUpdate(table, values, where, options) {
      check(options); assert.equal(table, 'products');
      Object.assign(working.find(p => p.productId === where.productId), values);
    },
    async bulkInsert(table, rows, options) {
      check(options); assert.equal(table, 'products'); working.push(...clone(rows));
    },
  };
}
test('imports all JSON rows including duplicate master company codes; repeat run preserves new stock', async () => {
  const qi = database(existing);
  qi.rows[0].quantity = 999;
  qi.rows[0].meta.liveOnly = 'preserved';
  assert.deepEqual(await seedPayloads(qi, existing, fresh), { updated: 104, inserted: 67, skipped: 0 });
  assert.equal(qi.rows[0].quantity, 999);
  assert.equal(qi.rows[0].meta.liveOnly, 'preserved');
  assert.deepEqual(JSON.parse(qi.rows[0].images), JSON.parse(existing[0].images));
  const inserted = qi.rows.find(p => p.productId === fresh[0].productId);
  assert.deepEqual(JSON.parse(inserted.meta), fresh[0].meta);
  assert.deepEqual(JSON.parse(inserted.images), JSON.parse(fresh[0].images));
  inserted.quantity = 123;
  assert.deepEqual(await seedPayloads(qi, existing, fresh), { updated: 104, inserted: 0, skipped: 67 });
  assert.equal(qi.rows.find(p => p.productId === fresh[0].productId).quantity, 123);
});
test('ID/code conflicts roll back earlier updates', async () => {
  const live = { ...clone(existing[0]), name: 'Before' };
  const collision = { ...clone(fresh[0]), productId: '11111111-1111-4111-8111-111111111111' };
  const qi = database([live, collision]);
  await assert.rejects(seedPayloads(qi, [existing[0]], [fresh[0]]), /conflict/);
  assert.equal(qi.rows[0].name, 'Before');
});
test('missing existing products and late company code collisions abort', async () => {
  await assert.rejects(seedPayloads(database([]), [existing[0]], []), /missing/);
  const late = { ...clone(fresh[0]), productId: '11111111-1111-4111-8111-111111111111', product_code: 'OTHER' };
  await assert.rejects(seedPayloads(database([late]), [], [fresh[0]]), /Company code already exists/);
});
test('malformed JSON fields, dates, and duplicate payloads fail before writes', async () => {
  const qi = database([]);
  await assert.rejects(seedPayloads(qi, [], [fresh[0], fresh[0]]), /Duplicate payload/);
  await assert.rejects(seedPayloads(qi, [], [{ ...fresh[0], images: '{}' }]), /Invalid images/);
  await assert.rejects(seedPayloads(qi, [], [{ ...fresh[0], createdAt: 'bad' }]), /Invalid createdAt/);
  assert.equal(qi.rows.length, 0);
});
test('new inserts are blocked when catalogue code already exists as live product_code', async () => {
  const late = { ...clone(fresh[0]), productId: '11111111-1111-4111-8111-111111111111', product_code: fresh[0].meta[COMPANY_CODE_KEY], meta: {} };
  const qi = database([late]);
  await assert.rejects(seedPayloads(qi, [], [fresh[0]]), /Company code already exists/);
  assert.equal(qi.rows.length, 1);
});
test('existing product_code-only matches can be seeded without company metadata', async () => {
  const product = { ...clone(existing[0]), meta: {} };
  const qi = database([product]);
  assert.deepEqual(await seedPayloads(qi, [product], []), { updated: 1, inserted: 0, skipped: 0 });
});
