'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('quotation_settings', {
      id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      quotationId: { type: S.UUID, allowNull: false, references: { model: 'quotations', key: 'quotationId' }, onDelete: 'CASCADE' },
      userId: { type: S.UUID, allowNull: false },
      version: { type: S.STRING(32), allowNull: false, defaultValue: 'current' },
      settings: { type: S.JSON, allowNull: false },
      createdAt: { type: S.DATE, allowNull: false },
      updatedAt: { type: S.DATE, allowNull: false },
    });
    await q.addIndex('quotation_settings', ['quotationId', 'userId', 'version'], { unique: true, name: 'quotation_settings_user_version' });
  },
  async down(q) { await q.dropTable('quotation_settings'); },
};
