const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const modelPath = require.resolve('../models');
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
let products, history, permission, referenced, failHistory;
const clone = value => JSON.parse(JSON.stringify(value));
const reset = () => {
  products = ids.map((productId, index) => ({ productId, name: `Product ${index}`, quantity: 10, meta: { code: 'DUPLICATE', price: 100, unrelated: 'keep' } }));
  history = []; permission = 'edit'; referenced = false; failHistory = false;
};
const models = {
  Product: {
    findAll: async options => products.filter(product => options.where.productId[Op.in].includes(product.productId)).map(data => ({ ...data, update: async changes => Object.assign(data, changes), toJSON: () => clone(data), destroy: async () => { products = products.filter(product => product.productId !== data.productId); } })),
    count: async () => 0,
    destroy: async options => { products = products.filter(product => !options.where.productId[Op.in].includes(product.productId)); },
  },
  ProductMeta: { findAll: async () => [{ id: 'price', slug: 'sellingPrice' }, { id: 'code', slug: 'companyCode' }] },
  InventoryHistory: { count: async () => history.length, create: async data => { if (failHistory) throw Error('History write failed'); history.push(clone(data)); }, findAll: async () => clone(history) },
  ProductKeyword: { destroy: async () => {} },
  User: { findByPk: async () => ({ roleId: 'role' }), findAll: async () => [{ userId: 'actor', name: 'Operator' }] },
  Role: { findByPk: async () => ({ roleName: 'USERS', permissions: (Array.isArray(permission) ? permission : [permission]).map(api => ({ api, module: 'products' })) }) },
  Permission: {},
};
models.InventoryHistory.name = 'InventoryHistory';
models.InventoryHistory.rawAttributes = { productId: {} };
models.sequelize = {
  models: { InventoryHistory: models.InventoryHistory, Order: { name: 'Order', rawAttributes: { products: { type: { key: 'JSON' } } }, findAll: async () => referenced ? [{ id: 'order', products: [{ productId: ids[0] }] }] : [] } },
  col: key => key, cast: value => value, where: (...values) => values,
  transaction: async (options, callback) => {
    const before = clone({ products, history });
    try { return await (callback || options)({ LOCK: { UPDATE: 'UPDATE' } }); }
    catch (error) { products = before.products; history = before.history; throw error; }
  },
};
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: models };
const deletionPath = require.resolve('../modules/products/product-delete.service');
const deletionModule = require(deletionPath);
require.cache[deletionPath].exports = { ...deletionModule, createProductDeletionService: database => deletionModule.createProductDeletionService(database, async () => []) };
const router = require('../modules/products/inventory-bulk.route');
async function call(path, body) {
  const req = { path, body, user: { userId: 'actor' } };
  const result = { status: 200 };
  const res = { status: code => { result.status = code; return res; }, json: data => { result.body = data; return res; } };
  let allowed = false;
  const authorize = router.stack.find(layer => layer.name === 'authorize').handle;
  await authorize(req, res, error => { if (error) throw error; allowed = true; });
  if (allowed) await router.stack.find(layer => layer.route?.path === path).route.stack[0].handle(req, res, error => { result.status = 500; result.error = error.message; });
  return result;
}
test('selected IDs distinguish products sharing the same company code, and stock writes actor history', async () => {
  reset();
  const result = await call('/update', { updates: [{ productId: ids[1], quantity: 0, expectedQuantity: 10 }] });
  assert.equal(result.status, 200); assert.equal(products[0].quantity, 10); assert.equal(products[1].quantity, 0);
  assert.deepEqual(history[0], { productId: ids[1], change: -10, quantityAfter: 0, action: 'adjustment', userId: 'actor', message: 'Bulk inventory adjustment' });
});
test('prices update metadata and preserve stock and unrelated fields, including a zero price', async () => {
  reset();
  const result = await call('/update', { updates: [{ productId: ids[0], sellingPrice: 0, expectedSellingPrice: 100 }] });
  assert.equal(result.status, 200); assert.equal(products[0].meta.price, 0); assert.equal(products[0].meta.unrelated, 'keep'); assert.equal(products[0].quantity, 10); assert.equal(history.length, 0);
});
test('stale rows and history failures roll back the entire selected batch', async () => {
  reset();
  const result = await call('/update', { updates: [{ productId: ids[0], quantity: 11, expectedQuantity: 10 }, { productId: ids[1], quantity: 12, expectedQuantity: 9 }] });
  assert.equal(result.status, 409); assert.equal(products[0].quantity, 10); assert.equal(history.length, 0);
  failHistory = true;
  const failed = await call('/update', { updates: [{ productId: ids[0], quantity: 15, expectedQuantity: 10 }] });
  assert.equal(failed.status, 500); assert.equal(products[0].quantity, 10);
});
test('invalid values, duplicated IDs, missing products and stale prices are rejected', async () => {
  reset();
  for (const quantity of [-1, 1.5, 2147483648, '4']) assert.equal((await call('/update', { updates: [{ productId: ids[0], quantity, expectedQuantity: 10 }] })).status, 400);
  assert.equal((await call('/update', { updates: [{ productId: ids[0], sellingPrice: 50, expectedSellingPrice: 90 }] })).status, 409);
  permission = 'export';
  assert.equal((await call('/export', { productIds: [ids[0], ids[0]] })).status, 400);
  assert.equal((await call('/export', { productIds: ['33333333-3333-4333-8333-333333333333'] })).status, 409);
});
test('delete requires permission and preserves history and JSON references', async () => {
  reset();
  assert.equal((await call('/delete', { productIds: ids })).status, 403);
  permission = 'delete'; history = [{ productId: ids[0] }];
  assert.equal((await call('/delete', { productIds: ids })).status, 409); assert.equal(products.length, 2);
  history = []; referenced = true;
  assert.equal((await call('/delete', { productIds: ids })).status, 409); assert.equal(products.length, 2);
  referenced = false;
  assert.equal((await call('/delete', { productIds: ids })).status, 200); assert.equal(products.length, 0);
});
test('delete preview requires delete permission and shows reference counts', async () => {
  reset();
  assert.equal((await call('/delete-preview', { productIds: ids })).status, 403);
  permission = 'delete'; referenced = true;
  const result = await call('/delete-preview', { productIds: ids });
  assert.equal(result.status, 200); assert.equal(result.body.canDelete, false);
  assert.equal(result.body.references.find(group => group.category === 'Order').count, 1);
});
test('history export includes all records beyond the default history page size', async () => {
  reset(); permission = 'export';
  history = Array.from({ length: 75 }, (_, i) => ({ id: String(i), productId: ids[0], userId: 'actor', change: 1, quantityAfter: i + 1 }));
  const result = await call('/export', { productIds: ids, includeHistory: true });
  assert.equal(result.status, 200); assert.equal(result.body.history.length, 75); assert.equal(result.body.products[0].companyCode, 'DUPLICATE'); assert.equal(result.body.products[0].sellingPrice, 100); assert.equal(result.body.users[0].name, 'Operator');
  assert.equal((await call('/export', { productIds: ids })).body.history.length, 0);
});
test('merge preview and confirmation both require edit and delete permissions', async () => {
  reset();
  assert.equal((await call('/merge-preview', { keeperId: ids[0], sourceId: ids[0] })).status, 403);
  permission = 'delete';
  assert.equal((await call('/merge', {})).status, 403);
  permission = ['edit', 'delete'];
  assert.equal((await call('/merge-preview', { keeperId: ids[0], sourceId: ids[0] })).status, 400);
});
