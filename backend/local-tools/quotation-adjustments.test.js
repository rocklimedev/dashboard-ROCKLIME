const test = require('node:test');
const assert = require('node:assert/strict');
const { lineAmounts, quotationTotals } = require('../lib/quotationMath');
test('item additional discount applies per unit; miscellaneous item charges are ignored', () => {
  assert.equal(
    lineAmounts({
      price: 100,
      quantity: 3,
      discount: 10,
      discountType: 'percent',
      miscellaneousCharges: 5,
      additionalDiscount: 2,
    }).net,
    264,
  );
});
test('flat item price overrides ordinary price and discount; zero is valid', () => {
  assert.equal(
    lineAmounts({
      price: 100,
      quantity: 2,
      discount: 50,
      flatPrice: 80,
      miscellaneousCharges: 5,
      additionalDiscount: 2,
    }).net,
    156,
  );
  assert.equal(lineAmounts({ price: 100, quantity: 2, flatPrice: 0 }).net, 0);
  assert.equal(lineAmounts({ price: 100, quantity: 2, flatPrice: null }).net, 200);
});
test('quotation adjustments, extra discount, GST and rounding share one base', () => {
  const t = quotationTotals({
    items: [
      { price: 100, quantity: 3, miscellaneousCharges: 5, additionalDiscount: 2 },
      { price: 999, quantity: 1, isOptionFor: 'main' },
    ],
    shipping: 10,
    miscellaneousChargeItems: [
      { name: 'Packing', amount: 15 },
      { name: 'Handling', amount: 5 },
    ],
    additionalDiscount: 5,
    extraDiscount: 10,
    extraDiscountType: 'percent',
    gstRate: 18,
  });
  assert.equal(t.goodsValue, 294);
  assert.equal(t.taxableValue, 286.6);
  assert.equal(t.gstAmount, 51.59);
  assert.equal(t.grandTotal, 338);
  assert.equal(t.optionalTotal, 999);
});
test('quotation flat price overrides goods only and preserves freight and tax', () => {
  const t = quotationTotals({
    items: [{ price: 100, quantity: 3 }],
    flatPrice: 200,
    shipping: 10,
    miscellaneousCharges: 20,
    additionalDiscount: 5,
    gstRate: 18,
  });
  assert.equal(t.taxableValue, 225);
  assert.equal(t.grandTotal, 266);
  assert.equal(
    quotationTotals({ items: [{ price: 100, quantity: 3 }], flatPrice: 0 }).grandTotal,
    0,
  );
});

test('named quotation charges retain names and override the legacy aggregate', () => {
  const t = quotationTotals({
    items: [{ price: 100, quantity: 1 }],
    miscellaneousCharges: 999,
    miscellaneousChargeItems: [
      { name: 'Packing', amount: 20 },
      { name: 'Delivery labour', amount: 30 },
    ],
  });
  assert.equal(t.miscellaneousCharges, 50);
  assert.deepEqual(t.miscellaneousChargeItems, [
    { name: 'Packing', amount: 20 },
    { name: 'Delivery labour', amount: 30 },
  ]);
  assert.equal(t.taxableValue, 150);
  assert.equal(
    quotationTotals({ miscellaneousCharges: 99, miscellaneousChargeItems: [] }).taxableValue,
    0,
  );
});
