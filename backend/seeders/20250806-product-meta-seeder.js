"use strict";

const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const metaFilePath = path.resolve(__dirname, "./productMetaFields.json");
    const rawData = fs.readFileSync(metaFilePath);
    const metas = JSON.parse(rawData);

    const dataToInsert = metas.map((meta) => ({
      id: uuidv4(),
      title: meta.title,
      fieldType: meta.fieldType,
      unit: meta.unit || null,
      createdAt: new Date(),
    }));

    await queryInterface.bulkInsert("product_metas", dataToInsert, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("product_metas", null, {});
  },
};
