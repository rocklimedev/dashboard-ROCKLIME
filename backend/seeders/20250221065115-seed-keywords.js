"use strict";

const { v4: uuidv4 } = require("uuid"); // Import UUID function

module.exports = {
  async up(queryInterface, Sequelize) {
    const ceramicsKeywords = [
      "basin", "toilet", "bidet", "counter", "vessel", "seat", "cover",
      "wc back to wall", "wc wall-hung", "wc one-piece", "wc close-coupled",
      "wb wall-hung", "urinal Floor standing", "urinal wall-hung",
      "Pedistal", "Semi-Pedestal"
    ];

    const sanitaryKeywords = [
      "shower", "faucet", "mixer", "bath", "spout", "spray"
    ];

    // Combine all keywords into one array
    const keywords = [
      ...ceramicsKeywords.map(keyword => ({
        id: uuidv4(), // Generate unique UUID for each keyword
        keyword,
        type: "Ceramics",
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      ...sanitaryKeywords.map(keyword => ({
        id: uuidv4(), // Generate unique UUID for each keyword
        keyword,
        type: "Sanitary",
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    ];

    // Insert into the 'Keywords' table
    await queryInterface.bulkInsert("Keywords", keywords, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Keywords", null, {});
  }
};
