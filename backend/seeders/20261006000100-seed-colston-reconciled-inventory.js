'use strict';

const { seedFiles } = require('../scripts/lib/seedReconciledInventory');

module.exports = {
  async up(queryInterface) {
    await seedFiles(queryInterface);
  },
  async down() {
    throw new Error('Automatic undo is unavailable: this seeder updates existing products. Restore from a verified backup if reversal is required.');
  },
};
