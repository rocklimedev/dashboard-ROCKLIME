const { test } = require('node:test');
const assert = require('node:assert/strict');
const rows = require('./quotation-room-reference-fixtures.json');
const { quotationTotals, r2 } = require('../lib/quotationMath');

// Reconstruct the printed room lines. "Net" rows unchanged between PDFs are
// flat-price inputs; other Net rows have equivalent fixed per-unit discounts.
// Original saved product/location data is not available in a PDF. Allocation
// rounding can differ by paise when 49 products are expanded into 68 room rows.
function items() {
  return rows.map((row) => ({
    productId: row.productId, roomName: row.room, price: row.price, quantity: row.quantity,
    discountType: row.inclusive.label === 'Net' ? 'fixed' : 'percent',
    discount: row.inclusive.label === 'Net'
      ? r2(row.price - row.inclusive.rate) : parseFloat(row.inclusive.label),
    ...(row.inclusive.label === 'Net' && row.inclusive.rate === row.exclusive.rate
      ? { flatPrice: row.inclusive.rate } : {}),
  }));
}
function totals(gstBasis) {
  return quotationTotals({ items: items(), discountMode: 'advanced', gstBasis, gstRate: 18 });
}

test('68 inclusive room rows reproduce all printed amounts and include flat-price savings', () => {
  assert.equal(rows.length, 68);
  const t = totals('inclusive');
  rows.forEach((row, i) => {
    assert.equal(t.lines[i].rate, row.inclusive.rate, `${row.room}: ${row.productId}`);
    assert.equal(t.lines[i].net, row.inclusive.net, `${row.room}: ${row.productId}`);
  });
  assert.equal(t.mrpValue, 1558044);
  assert.equal(t.goodsValue, 769267.10);
  assert.equal(t.grandTotal, 769267);
  assert.equal(t.lineDiscount, 788776.90);
  assert.equal(r2(t.mrpValue - t.lineDiscount), t.goodsValue);
});

test('four Uniset prices and one flush plate convert before GST instead of attracting GST twice', () => {
  const t = totals('exclusive');
  const flat = t.lines.filter((row) => row.flatPrice != null);
  assert.equal(flat.length, 5);
  assert.equal(flat.filter((row) => row.flatPrice === 4500).length, 4);
  for (const row of flat) {
    assert.equal(row.rate, row.flatPrice === 4500 ? 3813.56 : 1610.17);
    assert.equal(Math.round(row.net * 1.18), row.flatPrice);
  }
  assert.equal(t.taxableValue, 651921.27);
  assert.equal(t.gstAmount, 117345.83);
  assert.equal(t.grandTotal, 769267);
  assert.equal(t.lines.filter((row) => row.d2DiscountPercent.toFixed(2) === '61.86').length > 0, true);
  assert.equal(r2(t.mrpValue - t.lineDiscount), t.goodsValue);
});

test('full-precision D2 removes the mode difference while keeping two-decimal display', () => {
  const inclusive = totals('inclusive');
  const exclusive = totals('exclusive');
  for (const row of exclusive.lines.filter((row) => row.flatPrice == null)) {
    assert.ok(Math.abs(row.d2DiscountPercent - (100 - (100 - row.d1DiscountPercent) / 1.18)) < 1e-10);
  }
  assert.equal(inclusive.grandTotal, exclusive.grandTotal);
  assert.equal(inclusive.beforeRound, exclusive.beforeRound);
  assert.equal(r2(exclusive.lines.reduce((sum, row) => sum + row.net, 0)), exclusive.goodsValue);
});

test('flat-price conversion handles quantity, zero, optional items and quotation-wide flat price', () => {
  const t = quotationTotals({ items: [
    { price: 10200, quantity: 4, flatPrice: 4500 },
    { price: 4300, quantity: 2, flatPrice: 1900, isOption: true },
    { price: 100, quantity: 3, flatPrice: 0 },
  ], discountMode: 'advanced', gstBasis: 'exclusive', gstRate: 18 });
  assert.equal(t.goodsValue, 15254.24);
  assert.equal(t.grandTotal, 18000);
  assert.equal(t.optionalTotal, 3220.34);
  assert.equal(t.lines[1].net, 0);
  const flat = quotationTotals({ flatPrice: 1180, discountMode: 'advanced', gstBasis: 'exclusive', gstRate: 18 });
  assert.equal(flat.goodsValue, 1000);
  assert.equal(flat.grandTotal, 1180);
});
