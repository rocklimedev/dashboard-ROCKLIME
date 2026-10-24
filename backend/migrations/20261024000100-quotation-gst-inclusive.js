'use strict';
module.exports = {
  async up(q, S) {
    const columns = await q.describeTable('quotations');
    if (!columns.gstInclusive) await q.addColumn('quotations', 'gstInclusive', { type: S.BOOLEAN, allowNull: false, defaultValue: false });
  },
  async down(q) { await q.removeColumn('quotations', 'gstInclusive'); },
};
