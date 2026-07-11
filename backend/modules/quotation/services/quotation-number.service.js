const moment = require("moment");
const { Op } = require("sequelize");
const { Quotation } = require("../models");

/**
 * Generates the next daily sequential quotation reference number:
 * QUO<DDMMYY>101, QUO<DDMMYY>102, ...
 * Must be called inside an active transaction `t` for row-locking to matter.
 */
async function generateQuotationNumber(t) {
  const today = moment();
  const prefixDate = today.format("DDMMYY");
  const fullPrefix = `QUO${prefixDate}`;
  const todayStart = today.startOf("day").toDate();
  const todayEnd = today.endOf("day").toDate();

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    const last = await Quotation.findOne({
      where: {
        reference_number: { [Op.like]: `${fullPrefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: ["reference_number"],
      order: [["reference_number", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (last) {
      const seqStr = last.reference_number.slice(fullPrefix.length);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed) && parsed >= 100) {
        nextSeq = parsed + 1;
      }
    }

    const candidate = `${fullPrefix}${nextSeq}`;
    const exists = await Quotation.findOne({
      where: { reference_number: candidate },
      transaction: t,
    });

    if (!exists) return candidate;
  }

  throw new Error(
    `Could not generate unique quotation number after ${MAX_ATTEMPTS} attempts`,
  );
}

module.exports = { generateQuotationNumber };
