'use strict';

const { seedFiles } = require('../scripts/lib/seedColstonPricing');

module.exports = {
  async up(queryInterface) {
    await seedFiles(queryInterface);
  },
  async down() {
    throw new Error(
      'Automatic undo is unavailable because existing products are updated. Restore a verified backup to reverse this import.',
    );
  },
};
