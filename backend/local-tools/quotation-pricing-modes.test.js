// Pricing modes: generic (today's maths), advanced-exclusive (D2) and advanced-inclusive (D1).
//   node --test local-tools/quotation-pricing-modes.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  quotationTotals,
  resolvePricingMode,
  pricingFromRecord,
} = require('../lib/quotationMath');

const line = (price, extra = {}) => ({ price, quantity: 1, discount: 0, ...extra });

test('D1 advanced-inclusive: 1180 less 10% is 1062, GST 162 is extracted, not added', () => {
  const t = quotationTotals({
    items: [line(1180, { discount: 10, discountType: 'percent' })],
    gstRate: 18,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
  });
  assert.equal(t.grandTotal, 1062);
  assert.equal(t.gstAmount, 162);
  assert.equal(t.taxableValue, 900);
  assert.equal(t.cgst + t.sgst, 162);
  assert.equal(t.roundOff, 0);
  assert.equal(t.pricingMode, 'advanced-inclusive');
});

test('D2 advanced-exclusive: 1000 less 10% is 900, GST 162 added, total 1062', () => {
  const t = quotationTotals({
    items: [line(1000, { discount: 10, discountType: 'percent' })],
    gstRate: 18,
    discountMode: 'advanced',
    gstBasis: 'exclusive',
  });
  assert.equal(t.taxableValue, 900);
  assert.equal(t.gstAmount, 162);
  assert.equal(t.grandTotal, 1062);
  assert.equal(t.pricingMode, 'advanced-exclusive');
});

test('advanced-exclusive gives the same figures as generic for the same inputs', () => {
  const input = {
    items: [line(4850, { quantity: 3, discount: 5, discountType: 'percent' }), line(18900, { quantity: 2, discount: 8, discountType: 'percent' })],
    shipping: 500,
    extraDiscount: 3,
    gstRate: 18,
  };
  const generic = quotationTotals(input);
  const advanced = quotationTotals({ ...input, discountMode: 'advanced', gstBasis: 'exclusive' });
  for (const k of ['taxableValue', 'gstAmount', 'cgst', 'sgst', 'roundOff', 'grandTotal']) {
    assert.equal(advanced[k], generic[k], k);
  }
});

test('generic ignores the GST basis and always runs exclusive arithmetic', () => {
  const plain = quotationTotals({ items: [line(1180)], gstRate: 18 });
  const withBasis = quotationTotals({ items: [line(1180)], gstRate: 18, discountMode: 'generic', gstBasis: 'inclusive' });
  assert.equal(withBasis.grandTotal, plain.grandTotal);
  assert.equal(withBasis.grandTotal, 1392); // 1180 + 212.40, rounded
  assert.equal(withBasis.pricingMode, 'generic');
});

test('advanced with no GST basis chosen is refused, never defaulted', () => {
  assert.throws(
    () => quotationTotals({ items: [line(100)], gstRate: 18, discountMode: 'advanced', gstBasis: null }),
    (e) => e.status === 400 && /Choose GST inclusive or exclusive/.test(e.message),
  );
  assert.equal(resolvePricingMode({ discountMode: 'advanced' }).pricingMode, null);
});

test('inter-state inclusive quotation shows IGST for the extracted GST', () => {
  const t = quotationTotals({
    items: [line(1180)],
    gstRate: 18,
    interState: true,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
  });
  assert.equal(t.igst, 180);
  assert.equal(t.cgst, 0);
  assert.equal(t.grandTotal, 1180);
  assert.equal(t.taxableValue, 1000);
});

test('inclusive with rate 0 has no GST and the total is the price', () => {
  const t = quotationTotals({ items: [line(500)], gstRate: 0, discountMode: 'advanced', gstBasis: 'inclusive' });
  assert.equal(t.gstAmount, 0);
  assert.equal(t.taxableValue, 500);
  assert.equal(t.grandTotal, 500);
});

test('inclusive rounds the payable amount, and the rounding is shown as round-off', () => {
  const t = quotationTotals({ items: [line(1062.4)], gstRate: 18, discountMode: 'advanced', gstBasis: 'inclusive' });
  assert.equal(t.grandTotal, 1062);
  assert.equal(t.roundOff, -0.4);
  assert.equal(t.gstAmount, 162);
  assert.equal(t.taxableValue, 900);
});

test('pricingFromRecord: old quotations stay generic, new ones use their saved basis', () => {
  assert.deepEqual(pricingFromRecord({}), { discountMode: 'generic', gstBasis: null, gstInclusive: false });
  assert.deepEqual(pricingFromRecord({ gstInclusive: true }), { discountMode: 'generic', gstBasis: null, gstInclusive: false });
  assert.deepEqual(pricingFromRecord({ discountMode: 'advanced', gstBasis: 'inclusive' }), { discountMode: 'advanced', gstBasis: 'inclusive', gstInclusive: true });
  // Legacy boolean is honoured only when the new basis was never sent.
  assert.deepEqual(pricingFromRecord({ discountMode: 'advanced', gstInclusive: true }), { discountMode: 'advanced', gstBasis: 'inclusive', gstInclusive: true });
  assert.deepEqual(pricingFromRecord({ discountMode: 'advanced', gstBasis: null }), { discountMode: 'advanced', gstBasis: null, gstInclusive: false });
});

test('controller no longer zeroes GST for inclusive quotations', () => {
  const src = fs.readFileSync(path.join(__dirname, '../modules/quotations/quotation.controller.js'), 'utf8');
  assert.equal(/gstInclusive\s*\?\s*0\s*:/.test(src), false, 'GST must not be forced to 0');
});
