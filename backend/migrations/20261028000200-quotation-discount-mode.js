'use strict';
/**
 * Adds the discount mode and GST basis to quotations.
 *   discountMode 'generic'  → today's discounting (exclusive arithmetic)
 *   discountMode 'advanced' → D1/D2, using gstBasis
 *   gstBasis     'inclusive' | 'exclusive' | NULL (not chosen yet)
 *
 * Existing quotations stay generic. Quotations saved with gstInclusive = true
 * remain generic until explicitly edited. The old code stored those
 * with gst = 0, so their GST rate is unknown. They are listed for review and
 * their stored totals are NOT recalculated here.
 */
module.exports = {
  async up(q, S) {
    const columns = await q.describeTable('quotations');
    if (!columns.discountMode) {
      await q.addColumn('quotations', 'discountMode', {
        type: S.STRING(16),
        allowNull: false,
        defaultValue: 'generic',
      });
    }
    if (!columns.gstBasis) {
      await q.addColumn('quotations', 'gstBasis', {
        type: S.STRING(16),
        allowNull: true,
        defaultValue: null,
      });
    }
    const [review] = await q.sequelize.query(
      'SELECT quotationId, reference_number, gst, finalAmount FROM quotations WHERE gstInclusive = true AND (gst IS NULL OR gst = 0)',
    );
    if (review.length) {
      console.warn(
        `[quotation-discount-mode] ${review.length} inclusive quotation(s) were saved with GST 0 and need a rate review: ` +
          review.map((r) => r.reference_number).join(', '),
      );
    }
  },
  async down(q) {
    await q.removeColumn('quotations', 'gstBasis');
    await q.removeColumn('quotations', 'discountMode');
  },
};
