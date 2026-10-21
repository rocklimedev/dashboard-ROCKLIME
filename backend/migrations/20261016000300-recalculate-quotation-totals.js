'use strict';

/**
 * Re-saves every quotation's total with the single quotation maths
 * (GST on the taxable value, rounding to the rupee last). The old maths
 * rounded before GST, so stored totals could be up to ₹1 off the PDF.
 * Orders are not touched. Safe to run more than once.
 */
const { quotationTotals } = require('../lib/quotationMath');

const parse = (v) => {
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
};

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT quotationId, products, extraDiscount, extraDiscountType, shippingAmount, gst, finalAmount FROM quotations',
    );
    let changed = 0;
    for (const q of rows) {
      const items = parse(q.products);
      if (!items.length) continue;
      const t = quotationTotals({
        items,
        extraDiscount: q.extraDiscount,
        extraDiscountType: q.extraDiscountType || 'percent',
        shipping: q.shippingAmount,
        gstRate: q.gst,
      });
      if (Math.abs(Number(q.finalAmount) - t.grandTotal) < 0.005) continue;
      await queryInterface.sequelize.query(
        'UPDATE quotations SET finalAmount = ?, roundOff = ? WHERE quotationId = ?',
        { replacements: [t.grandTotal, t.roundOff, q.quotationId] },
      );
      changed++;
    }
    console.log(`Quotation totals re-checked: ${changed} of ${rows.length} updated`);
  },
};
