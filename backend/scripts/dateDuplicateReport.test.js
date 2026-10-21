const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildDuplicateReport } = require('../modules/operations/duplicate-report');
const { buildDateDuplicateReport } = require('../modules/operations/date-duplicate-report');
const metas = [
  { id: 'code', slug: 'companyCode' },
  { id: 'price', slug: 'sellingPrice' },
];
const product = (id, overrides = {}) => ({
  productId: id,
  product_code: id,
  name: 'Premium basin',
  meta: { code: 'DUP', price: 100 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});
const focus = (products, options) =>
  buildDateDuplicateReport(buildDuplicateReport(products, metas), products, metas, options);
test('India day includes the UTC start instant and excludes the next-day instant', () => {
  const result = focus([
    product('before', { updatedAt: '2026-07-23T18:29:59.999Z' }),
    product('start', { updatedAt: '2026-07-23T18:30:00.000Z' }),
    product('end', { updatedAt: '2026-07-24T18:29:59.999Z' }),
    product('after', { updatedAt: '2026-07-24T18:30:00.000Z' }),
  ]);
  assert.equal(result.summary.updatedOnDateProducts, 2);
  assert.deepEqual(result.matchedProducts.map((item) => item.productId).sort(), ['end', 'start']);
  assert.equal(result.updatedPairs.length, 5);
});
test('older updated products retain all older and later-created duplicate counterparts', () => {
  const result = focus([
    product('updated', { updatedAt: '2026-07-24T10:00:00+05:30', meta: { code: 'DUP', price: 0 } }),
    product('old'),
    product('later', { createdAt: '2026-08-01T00:00:00Z' }),
  ]);
  assert.equal(result.updatedPairs.length, 2);
  assert.equal(result.summary.olderProductsUpdatedOnDateWithDuplicates, 1);
  assert.equal(result.matchedProducts[0].currentSellingPrice, 0);
  assert.equal(result.matchedProducts[0].duplicates.length, 2);
  assert.equal(
    result.matchedProducts[0].duplicates[1].dateEvidence.creationRelation,
    'created_after_target_date',
  );
  assert.ok(result.updatedPairs.every((pair) => pair.currentPricesDiffer));
});
test('created-on-date products remain discoverable after later updates', () => {
  const result = focus([
    product('new', { createdAt: '2026-07-24T06:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }),
    product('old'),
  ]);
  assert.equal(result.updatedPairs.length, 0);
  assert.equal(result.createdPairs.length, 1);
  assert.equal(result.matchedProducts[0].createdOnTargetDate, true);
  assert.equal(result.matchedProducts[0].updatedOnTargetDate, false);
});
test('timezone-less timestamps use the explicit source offset, never host timezone', () => {
  const products = [product('target', { updatedAt: '2026-07-24 22:00:00' }), product('other')];
  assert.equal(focus(products).updatedPairs.length, 0);
  assert.equal(focus(products, { timestampOffset: '+05:30' }).updatedPairs.length, 1);
  assert.equal(
    focus([product('date', { updatedAt: new Date('2026-07-24T00:00:00Z') }), product('other')])
      .updatedPairs.length,
    1,
  );
});
test('date matches without duplicate candidates are counted but excluded from focused pairs', () => {
  const result = focus([
    product('unique', { updatedAt: '2026-07-24T00:00:00Z', meta: { code: 'UNIQUE' } }),
    product('other'),
  ]);
  assert.equal(result.summary.updatedOnDateProducts, 1);
  assert.equal(result.summary.updatedOnDateProductsWithDuplicates, 0);
  assert.equal(result.matchedProducts.length, 0);
});
test('invalid calendar dates and options fail, missing timestamps are reported without matches', () => {
  for (const options of [
    { updatedOn: '2026-02-30' },
    { updatedOn: '24 Jul 26' },
    { timezone: 'bad/timezone' },
    { timestampOffset: '+14:30' },
  ])
    assert.throws(() => focus([], options));
  const result = focus([
    product('missing', { createdAt: null, updatedAt: 'bad' }),
    product('invalid', { updatedAt: '2026-02-30T00:00:00Z' }),
  ]);
  assert.equal(result.updatedPairs.length, 0);
  assert.equal(result.invalidDates.length, 2);
});
