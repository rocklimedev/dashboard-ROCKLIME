"use strict";

/**
 * Fills the new stock tables from the old products.quantity (see
 * modules/stock/opening.js). Runs once; skipped if balances already exist.
 * Needs MongoDB for purchase-order lines.
 */
module.exports = {
  async up() {
    const connectMongoDB = require("../config/dbMongo");
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) await connectMongoDB();
    const { buildOpeningBalances } = require("../modules/stock/opening");
    await buildOpeningBalances();
  },
  async down() {},
};
