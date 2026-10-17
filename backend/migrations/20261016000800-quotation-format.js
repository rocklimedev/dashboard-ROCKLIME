"use strict";

/**
 * New quotation format (cover page, rooms, inclusions/exclusions, payment
 * details). Moves saved settings that still hold the old defaults onto the new
 * ones; anything an admin already changed is left alone. Safe to run again.
 */
const OLD_TERMS = [
  "Prices are valid until the date shown above.",
  "Goods once sold will not be taken back except for manufacturing defects.",
  "Unloading and shifting at site are in the customer's scope unless quoted.",
  "Tiles and stone are natural/fired products; slight shade and size variation is normal.",
  "Subject to Delhi jurisdiction.",
];
// Payment details printed on the Chhabra Marble quotation format; only used where blank.
const BANK = {
  bankAccountName: "Embark Enterprises",
  bankName: "IDFC First Bank",
  bankAccountNo: "10179237657",
  bankIfsc: "IDFB0020149",
  bankBranch: "Bhera Enclave, Paschim Vihar",
  upiId: "paytm.s10y1wv@pty",
};

module.exports = {
  async up(queryInterface) {
    const { DEFAULTS } = require("./20261016000100-app-settings");
    const read = async (key) => {
      const [rows] = await queryInterface.sequelize.query("SELECT value FROM app_settings WHERE `key` = ?", { replacements: [key] });
      return rows[0] ? JSON.parse(rows[0].value) : null;
    };
    const write = (key, value) =>
      queryInterface.sequelize.query(
        "INSERT INTO app_settings (`key`, value, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = NOW()",
        { replacements: [key, JSON.stringify(value)] },
      );

    const q = (await read("quotation")) || {};
    if (!q.keyTerms || JSON.stringify(q.keyTerms) === JSON.stringify(OLD_TERMS)) q.keyTerms = DEFAULTS.quotation.keyTerms;
    if (q.validityDays == null || Number(q.validityDays) === 15) q.validityDays = DEFAULTS.quotation.validityDays;
    if (q.showCoverPage === false && !q.coverImage) q.showCoverPage = true;
    if (!q.includes) q.includes = DEFAULTS.quotation.includes;
    if (!q.excludes) q.excludes = DEFAULTS.quotation.excludes;
    await write("quotation", { ...DEFAULTS.quotation, ...q });

    const c = (await read("company")) || {};
    if (!c.brandName) c.brandName = DEFAULTS.company.brandName;
    if (!c.website || c.website === "www.cmtradingco.com") c.website = "cmtradingco.com";
    if (!c.bankAccountNo) Object.assign(c, BANK);
    await write("company", { ...DEFAULTS.company, ...c });
  },
  async down() {},
};
