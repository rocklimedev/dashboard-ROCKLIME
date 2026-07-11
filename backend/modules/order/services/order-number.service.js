const moment = require("moment");
const { Op } = require("sequelize");
const { Order } = require("../models");

/**
 * Generates the next daily sequential order number: DDMMYY101, DDMMYY102, ...
 * Must be called inside an active transaction `t` for row-locking to matter.
 */
async function generateDailyOrderNumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY"); // e.g. 150126

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // Find the highest sequence today
    const lastOrder = await Order.findOne({
      where: {
        orderNo: {
          [Op.like]: `${prefix}%`,
        },
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
      attributes: ["orderNo"],
      order: [["orderNo", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE, // reduces race window
    });

    let nextSeq = 101;

    if (lastOrder) {
      const lastSeqStr = lastOrder.orderNo.slice(prefix.length);
      const parsed = parseInt(lastSeqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    const candidate = `${prefix}${nextSeq}`;

    // Final collision check
    const conflict = await Order.findOne({
      where: { orderNo: candidate },
      transaction: t,
    });

    if (!conflict) {
      return candidate;
    }
  }

  throw new Error(
    `Failed to generate unique order number after ${MAX_ATTEMPTS} attempts`,
  );
}

module.exports = { generateDailyOrderNumber };
