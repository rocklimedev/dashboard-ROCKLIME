const { test } = require('node:test');
const assert = require('node:assert/strict');
const { reconcile } = require('./reconcileInventory');
const brandId = 'acbe7061-9b76-47d1-a509-e4b1f982a36f';
const snapshot = (products = []) => ({ products, brands: [{ id: brandId }], productMetas: [
  { id: 'company-id', slug: 'companyCode', fieldType: 'string' },
  { id: 'price-id', slug: 'sellingPrice', fieldType: 'number' },
  { id: 'color-id', slug: 'color_name', fieldType: 'string' },
] });
const row = (code = 'WL-123') => ({ name: 'New name', company_code: code, selling_price: 0, color: 'White', dimensions: '100x200 mm', description: 'Details' });
test('empty and JSON null database fields use nullable defaults', () => {
  for (const value of ['', '   ', 'null', null]) {
    const result = reconcile([row()], snapshot([
      { productId: 'empty-fields', brandId, product_code: 'OLD', meta: value, images: value, variantOptions: value },
      { productId: 'matched', brandId, product_code: 'MATCHED', meta: { companyCode: 'WL-123' }, images: value, variantOptions: value },
    ]));
    assert.equal(result.existing.length, 1);
    assert.equal(result.existing[0].images, null);
    assert.equal(result.existing[0].variantOptions, null);
  }
});
test('malformed database JSON identifies the product and column', () => {
  assert.throws(() => reconcile([], snapshot([
    { productId: 'broken-product', meta: '{', images: null },
  ])), /products\.broken-product\.meta/);
});
test('matches UUID metadata case-insensitively and preserves identity, stock and unrelated data', () => {
  const old = { productId: 'existing-id', product_code: 'ECLCO00000009', brandId, quantity: 37,
    categoryId: 'category', createdAt: 'original', images: '["image.png"]', variantOptions: '{"finish":"Matte"}',
    inventorySource: { page: 1 },
    meta: '{"company-id":" wl-123 ","other":"keep","price-id":90,"inventorySource":{"page":1}}' };
  const result = reconcile([row()], snapshot([old]), 'now');
  assert.equal(result.existing.length, 1);
  assert.equal(result.fresh.length, 0);
  const product = result.existing[0];
  assert.equal(product.productId, old.productId);
  assert.equal(product.product_code, old.product_code);
  assert.equal(product.quantity, 37);
  assert.equal(product.categoryId, 'category');
  assert.equal(product.createdAt, 'original');
  assert.deepEqual(product.images, ['image.png']);
  assert.deepEqual(product.variantOptions, { finish: 'Matte' });
  assert.equal(product.meta.other, 'keep');
  assert.equal(Object.hasOwn(product.meta, 'inventorySource'), false);
  assert.equal(Object.hasOwn(product, 'inventorySource'), false);
  assert.equal(product.meta['price-id'], 0);
  assert.equal(product.description, 'Details');
  assert.equal(old.meta.includes('90'), true);
});
test('new rows have full schema defaults, valid UUIDs and globally unique internal codes', () => {
  const result = reconcile([row(), row('WL-124')], snapshot([
    { brandId: 'other-brand', product_code: 'ECLCO00000010', meta: { 'company-id': 'WL-123' } },
  ]), 'now');
  assert.equal(result.fresh.length, 2);
  assert.deepEqual(result.fresh.map((p) => p.product_code), ['ECLCO00000011', 'ECLCO00000012']);
  assert.match(result.fresh[0].productId, /^[0-9a-f-]{36}$/);
  assert.equal(result.fresh[0].brandId, brandId);
  assert.equal(result.fresh[0].quantity, 0);
  assert.equal(result.fresh[0].categoryId, null);
  assert.equal(Object.hasOwn(result.fresh[0].meta, 'inventorySource'), false);
});
test('duplicate, missing, ambiguous and invalid rows are excluded for review', () => {
  const result = reconcile([row('DUP'), row(' dup '), row(''), row('AMB'), { ...row('BAD'), selling_price: 'oops' }], snapshot([
    { productId: 'a', brandId, meta: { 'company-id': 'AMB' } },
    { productId: 'b', brandId, meta: { companyCode: 'amb' } },
  ]));
  assert.equal(result.existing.length + result.fresh.length, 0);
  assert.deepEqual(result.review.map((r) => r.reason), ['duplicate_inventory_company_code', 'duplicate_inventory_company_code', 'missing_company_code', 'ambiguous_database_company_code', 'invalid_selling_price']);
});
test('blank source values preserve existing values and metadata definitions are required', () => {
  const result = reconcile([{ ...row(), description: '', color: null, selling_price: null }], snapshot([
    { brandId, meta: { companyCode: 'WL-123', 'price-id': 42, 'color-id': 'Red' }, description: 'Keep' },
  ]));
  assert.equal(result.existing[0].description, 'Keep');
  assert.equal(result.existing[0].meta['price-id'], 42);
  assert.equal(result.existing[0].meta['color-id'], 'Red');
  assert.throws(() => reconcile([row()], { ...snapshot(), productMetas: [] }), /metadata/);
});
test('actual inventory accounts for every row and quarantines known source issues', () => {
  const inventory = require('./json-outputs/inventory.json');
  const result = reconcile(inventory, snapshot());
  assert.equal(result.summary.inventoryRows, result.fresh.length + result.review.length);
  assert.equal(result.review.filter((r) => r.reason === 'missing_company_code').length, 4);
  assert.equal(result.review.filter((r) => r.reason === 'duplicate_inventory_company_code').length, 10);
  assert.equal(new Set(result.fresh.map((p) => p.product_code)).size, result.fresh.length);
});
