'use strict';
module.exports = {
  async up(q, S) {
    const columns = await q.describeTable('quotations');
    if (!columns.miscellaneousChargeItems)
      await q.addColumn('quotations', 'miscellaneousChargeItems', {
        type: S.JSON,
        allowNull: true,
        defaultValue: null,
      });
  },
  async down(q) {
    await q.removeColumn('quotations', 'miscellaneousChargeItems');
  },
};
