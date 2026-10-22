'use strict';
module.exports = {
  async up(q, S) {
    for (const table of ['tasks', 'calendar_events']) {
      await q.createTable(table, {
        id: { type: S.UUID, primaryKey: true, allowNull: false },
        ownerId: { type: S.CHAR(36), allowNull: false },
        data: { type: S.JSON, allowNull: false },
        external: { type: S.JSON, allowNull: true },
        syncState: { type: S.STRING(20), allowNull: false, defaultValue: 'local' },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
        deletedAt: { type: S.DATE, allowNull: true },
      });
      await q.addIndex(table, ['ownerId', 'deletedAt', 'createdAt']);
    }
  },
  async down(q) {
    await q.dropTable('calendar_events');
    await q.dropTable('tasks');
  },
};
