'use strict';
module.exports = {
  async up(q, S) {
    const columns = await q.describeTable('order_dispatches');
    for (const [name, definition] of Object.entries({
      quotationId: { type: S.UUID, allowNull: true },
      quotationRef: { type: S.STRING(50), allowNull: true },
      documentSnapshot: { type: S.JSON, allowNull: true },
    })) {
      if (!columns[name]) await q.addColumn('order_dispatches', name, definition);
    }
    await q.changeColumn('order_dispatches', 'orderId', { type: S.UUID, allowNull: true });
    await q.addIndex('order_dispatches', ['quotationId', 'dispatchNumber'], {
      name: 'quotation_dispatch_lookup',
    });
  },
  async down(q, S) {
    const [rows] = await q.sequelize.query(
      'SELECT COUNT(*) AS n FROM order_dispatches WHERE orderId IS NULL',
    );
    if (Number(rows[0].n))
      throw new Error('Quotation dispatches exist; preserve or migrate them before rolling back.');
    await q.removeIndex('order_dispatches', 'quotation_dispatch_lookup');
    for (const name of ['quotationId', 'quotationRef', 'documentSnapshot'])
      await q.removeColumn('order_dispatches', name);
    await q.changeColumn('order_dispatches', 'orderId', { type: S.UUID, allowNull: false });
  },
};
