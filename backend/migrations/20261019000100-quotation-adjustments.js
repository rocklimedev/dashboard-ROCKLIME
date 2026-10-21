'use strict';
module.exports = {
  async up(q, S) {
    const columns = await q.describeTable('quotations');
    for (const name of ['miscellaneousCharges', 'additionalDiscount', 'flatPrice']) {
      if (!columns[name])
        await q.addColumn('quotations', name, {
          type: S.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: name === 'flatPrice' ? null : 0,
        });
    }
  },
  async down(q) {
    for (const name of ['miscellaneousCharges', 'additionalDiscount', 'flatPrice'])
      await q.removeColumn('quotations', name);
  },
};
