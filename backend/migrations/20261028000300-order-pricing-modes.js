'use strict';
module.exports = {
  async up(q, S) {
    const columns = await q.describeTable('orders');
    if (!columns.discountMode)
      await q.addColumn('orders', 'discountMode', {
        type: S.STRING(16),
        allowNull: false,
        defaultValue: 'generic',
      });
    if (!columns.gstBasis)
      await q.addColumn('orders', 'gstBasis', {
        type: S.STRING(16),
        allowNull: true,
        defaultValue: null,
      });
  },
  async down(q) {
    await q.removeColumn('orders', 'gstBasis');
    await q.removeColumn('orders', 'discountMode');
  },
};
