const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { quotationTotals, lineAmounts, r2 } = require('../lib/quotationMath');
const { audit, inputs, referenceInputs, fixture } = require('./quotation-reference-audit');

test('inclusive PDF: all four observed rates, line amounts and total reproduce', () => {
  const result = quotationTotals({ items: inputs('inclusive'), gstRate: 0 });
  fixture.items.forEach((item, i) => {
    assert.equal(result.lines[i].rate, item.inclusive.rate, item.productId);
    assert.equal(result.lines[i].net, item.inclusive.net, item.productId);
  });
  for (const [key, value] of Object.entries(fixture.inclusiveTotals)) assert.equal(result[key], value, key);
});

test('exclusive PDF: inferred per-item D2 inputs reproduce all lines and GST-inclusive total', () => {
  const result = quotationTotals({ items: inputs('exclusive'), gstRate: fixture.gstRate });
  fixture.items.forEach((item, i) => {
    assert.equal(result.lines[i].rate, item.exclusive.rate, item.productId);
    assert.equal(result.lines[i].net, item.exclusive.net, item.productId);
  });
  for (const [key, value] of Object.entries(fixture.exclusiveTotals)) assert.equal(result[key], value, key);
});

test('advanced modes have identical payable totals instead of reproducing historical rounded D2 drift', () => {
  const result = quotationTotals({ items: referenceInputs(), gstRate: fixture.gstRate, discountMode: 'advanced', gstBasis: 'exclusive' });
  const inclusive = quotationTotals({ items: referenceInputs(), gstRate: fixture.gstRate, discountMode: 'advanced', gstBasis: 'inclusive' });
  assert.equal(result.grandTotal, inclusive.grandTotal);
  assert.equal(result.beforeRound, inclusive.beforeRound);
  assert.equal(result.lines[1].rate, 4500);
  assert.equal(result.lines[1].d2DiscountPercent.toFixed(2), '61.86');
  assert.equal(result.lines[2].d2DiscountPercent.toFixed(2), '49.15');
});

test('inclusive flat inputs are converted once before GST, including a zero override', () => {
  const result = quotationTotals({ items: [
    { price: 1450, quantity: 11, discount: 850, discountType: 'fixed', flatPrice: 600.03 },
    { price: 1000, quantity: 2, discount: 10, discountType: 'percent', flatPrice: 0 },
  ], discountMode: 'advanced', gstBasis: 'exclusive', gstRate: 18 });
  assert.equal(result.lines[0].net, 5593.5);
  assert.equal(result.lines[1].net, 0);
  assert.equal(result.gstAmount, 1006.83);
  assert.equal(result.grandTotal, 6600);
  const flat = quotationTotals({ items: inputs('inclusive'), flatPrice: 1000, gstRate: 18, discountMode: 'advanced', gstBasis: 'exclusive' });
  assert.equal(flat.goodsValue, 847.46);
  assert.equal(flat.grandTotal, 1000);
});

test('PDF percentage lines use two-decimal D2 inputs rather than displayed one-decimal labels', () => {
  fixture.items.filter((item) => item.inclusive.discountType === 'percent').forEach((item) => {
    const exact = 100 - (100 - item.inclusive.discount) / 1.18;
    assert.equal(r2(exact), item.exclusive.discount, item.productId);
    const line = lineAmounts({ ...item, ...item.exclusive });
    assert.equal(line.net, item.exclusive.net, item.productId);
  });
});

test('trimset PDF line amount is calculated before rounding the displayed unit rate', () => {
  const item = fixture.items.find((row) => row.productId === '19917000');
  assert.equal(r2(item.exclusive.rate * item.quantity), 9061.50);
  assert.equal(lineAmounts({ ...item, ...item.exclusive }).net, 9061.47);
});

test('manual net valve price in the PDFs differs from exact GST extraction', () => {
  const item = fixture.items[0];
  assert.equal(r2(item.inclusive.rate / 1.18), 508.47);
  assert.equal(item.exclusive.rate, 508.50);
});

test('frontend and backend produce identical dry-run reports for both PDF fixtures', async () => {
  const frontend = await import(pathToFileURL(path.resolve(__dirname, '../../frontend-v2/src/utils/quotationMath.js')).href);
  assert.deepEqual(audit(frontend), audit());
});
