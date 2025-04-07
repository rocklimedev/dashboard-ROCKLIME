"use strict";

const { v4: uuidv4 } = require("uuid");
const ParentCategory = require("../models/parentCategory"); // Adjust path if needed

module.exports = {
  up: async () => {
    const parentCategories = [
      {
        id: uuidv4(),
        slug: "CT_AS_001",
        name: "American Standard",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        slug: "CT_GK_002",
        name: "Grohe Kitchen",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        slug: "CT_GB_003",
        name: "Grohe Bau",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        slug: "CT_GP_004",
        name: "Grohe Premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        slug: "CT_GC_005",
        name: "Grohe Colour",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await ParentCategory.bulkCreate(parentCategories, {
      ignoreDuplicates: true, // Avoid inserting if slug or name already exists
    });
  },

  down: async () => {
    await ParentCategory.destroy({
      where: {
        slug: ["CT_AS_001", "CT_GK_002", "CT_GB_003", "CT_GP_004", "CT_GC_005"],
      },
    });
  },
};
