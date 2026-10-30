'use strict';
const { seed } = require('../modules/settings/quotation-presets');
const { DEFAULTS } = require('./20261016000100-app-settings');
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      const [rows] = await q.sequelize.query(
        'SELECT value FROM app_settings WHERE `key` = ? FOR UPDATE',
        {
          replacements: ['quotation'],
          transaction,
        },
      );
      const saved = rows.length
        ? typeof rows[0].value === 'string'
          ? JSON.parse(rows[0].value)
          : rows[0].value
        : {};
      if (saved.discountPresets != null) return;
      saved.discountPresets = seed({ ...DEFAULTS.quotation, ...saved });
      await q.sequelize.query(
        'INSERT INTO app_settings (`key`, value, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW()) ' +
          'ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = NOW()',
        { replacements: ['quotation', JSON.stringify(saved)], transaction },
      );
    });
  },
  // Presets are user data; retain them if the pricing columns are rolled back.
  async down() {},
};
