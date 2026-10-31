const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quotationTotals, r2 } = require('../lib/quotationMath');

test('mode switches preserve final payable and pre-round amount with mixed pricing and adjustments', () => {
  for (const gstRate of [0, 5, 12, 18, 28]) {
    for (const extraDiscountType of ['fixed', 'percent']) {
      for (const flatPrice of [null, 0, 1234.56]) {
        for (const offset of [0.01, 0.49, 0.50, 0.51, 0.99]) {
          const args = {
            items: [
              { price: 1180 + offset, quantity: 11, discount: 55.5, discountType: 'percent', additionalDiscount: 0.17 },
              { price: 10200, quantity: 4, flatPrice: 4500 },
              { price: 1450, quantity: 3, discount: 850, discountType: 'fixed' },
              { price: 3.73, quantity: 7, discount: 10, discountType: 'percent' },
              { price: 4300, quantity: 2, flatPrice: 1900, isOption: true },
            ],
            gstRate, extraDiscountType, extraDiscount: 3.5, flatPrice,
            shipping: 12.33, additionalDiscount: 1.27,
            miscellaneousChargeItems: [{ name: 'Packing', amount: 0.07 }, { name: 'Handling', amount: 20.11 }],
            discountMode: 'advanced',
          };
          const inclusive = quotationTotals({ ...args, gstBasis: 'inclusive' });
          const exclusive = quotationTotals({ ...args, gstBasis: 'exclusive' });
          assert.equal(exclusive.grandTotal, inclusive.grandTotal);
          assert.equal(exclusive.beforeRound, inclusive.beforeRound);
          assert.equal(exclusive.roundOff, inclusive.roundOff);
          assert.equal(r2(exclusive.taxableValue + exclusive.gstAmount), exclusive.beforeRound);
          assert.equal(r2(exclusive.beforeRound + exclusive.roundOff), exclusive.grandTotal);
          assert.equal(r2(exclusive.cgst + exclusive.sgst), exclusive.gstAmount);
          assert.equal(r2(exclusive.goodsValue + exclusive.freight + exclusive.miscellaneousCharges
            - exclusive.extraDiscountAmount - exclusive.additionalDiscountAmount + exclusive.taxableRoundingAdjustment), exclusive.taxableValue);
          if (flatPrice == null) assert.equal(r2(exclusive.lines.reduce((sum, row) => sum + row.net, 0)), exclusive.goodsValue);
          assert.equal(r2(exclusive.optionalLines.reduce((sum, row) => sum + row.net, 0)), exclusive.optionalTotal);
        }
      }
    }
  }
});

test('many low-value lines cannot move payable across a half-rupee rounding boundary', () => {
  for (const value of [0.49, 0.50, 0.51, 1.77, 1180.59]) {
    const args = { items: Array.from({ length: 101 }, () => ({ price: value, quantity: 1 })), discountMode: 'advanced', gstRate: 18 };
    const inclusive = quotationTotals({ ...args, gstBasis: 'inclusive' });
    const exclusive = quotationTotals({ ...args, gstBasis: 'exclusive' });
    assert.equal(exclusive.grandTotal, inclusive.grandTotal);
    assert.equal(exclusive.beforeRound, inclusive.beforeRound);
    assert.equal(r2(exclusive.lines.reduce((sum, row) => sum + row.net, 0)), exclusive.goodsValue);
    assert.ok(exclusive.lines.every((row) => row.net >= 0));
  }
});
