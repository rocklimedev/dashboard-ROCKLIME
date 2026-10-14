"use strict";
const { seedFiles } = require("../scripts/lib/seedAmProducts");
module.exports = {
  async up(queryInterface) {
    await seedFiles(queryInterface);
  },
  async down() {
    throw new Error(
      "Automatic undo is unavailable because this seeder updates existing products. Restore a verified backup to reverse it.",
    );
  },
};
