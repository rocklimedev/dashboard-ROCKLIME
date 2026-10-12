const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildDuplicateReport } = require('../modules/operations/duplicate-report');
const fields = [{ id: 'code', slug: 'companyCode' }];
const product = (id, overrides = {}) => ({ productId: id, product_code: id, name: 'Premium wall mounted basin', brandId: 'brand', meta: { code: 'C-123' }, ...overrides });
test('exact candidates retain full records and ignore only identity and timestamps', () => {
  const report = buildDuplicateReport([product('a'), product('b', { createdAt: 'yesterday' })], fields);
  assert.equal(report.exact.length, 1);
  assert.equal(report.exact[0].products[1].productId, 'b');
});
test('similar names and legitimate variants go to differences review', () => {
  const report = buildDuplicateReport([product('a'), product('b', { name: 'Premium wall mounted basins', variantOptions: { color: 'red' } }), product('c', { quantity: 3 })], fields);
  assert.equal(report.exact.length, 0);
  assert.equal(report.review.length, 3);
  assert.ok(report.review[0].differences.some(item => item.field === 'variantOptions'));
});
test('different codes, dissimilar names and missing codes never become matches', () => {
  const report = buildDuplicateReport([product('a'), product('b', { meta: { code: 'other' } }), product('c', { name: 'Toilet' }), product('d', { meta: {} })], fields);
  assert.equal(report.exact.length + report.review.length, 0);
  assert.equal(report.skipped[0].reason, 'missing_company_code');
});
test('legacy keys and JSON strings are supported, conflicting keys require review', () => {
  const report = buildDuplicateReport([product('a', { meta: JSON.stringify({ companyCode: ' c-123 ' }) }), product('b'), product('c', { meta: { code: 'C-123', companyCode: 'C-456' } }), product('d', { meta: '{' })], fields);
  assert.equal(report.review.length, 1);
  assert.deepEqual(report.skipped.map(item => item.reason), ['conflicting_company_codes', 'invalid_json']);
});
test('pairwise matching avoids transitive false matches and checks the 90 percent boundary', () => {
  const report = buildDuplicateReport(['abcdefghij', 'abcdefghiX', 'abcdefghYX'].map((name, i) => product(String(i), { name })), fields);
  assert.equal(report.review.length, 2);
  assert.throws(() => buildDuplicateReport([], fields, 0.8));
});
