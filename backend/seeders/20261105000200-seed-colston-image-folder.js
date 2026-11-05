'use strict';
const fs = require('node:fs/promises');
const { seedPayloads } = require('../scripts/colstonImageFolder');
module.exports = {
  async up(queryInterface) {
    const filename = process.env.COLSTON_IMAGE_UPDATES;
    if (!filename)
      throw new Error(
        'Set COLSTON_IMAGE_UPDATES to the generated colston_image_updates.json path.',
      );
    console.log(`Reading ${filename}`);
    const updates = JSON.parse((await fs.readFile(filename, 'utf8')).replace(/^\uFEFF/, ''));
    await seedPayloads(queryInterface, updates);
  },
  async down() {
    throw new Error(
      'Restore image values from the timestamped Colston backup to reverse this seeder.',
    );
  },
};
