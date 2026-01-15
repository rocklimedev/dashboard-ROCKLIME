// utils/generateDocumentNumber.js
const moment = require("moment");
const { Op } = require("sequelize");

async function generateDailyNumber(prefixStyle, transaction) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY"); // 150126

  let attempt = 0;
  const MAX_ATTEMPTS = 10;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // Predict next number (optimistic)
    const existing = await transaction.model.findAll({
      where: {
        [prefixStyle.field]: {
          [Op.like]: `${prefixStyle.prefixLike}${prefix}%`,
        },
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
      attributes: [prefixStyle.field],
      order: [[prefixStyle.field, "DESC"]],
      limit: 1,
      transaction,
      lock: transaction.LOCK.UPDATE, // helps a bit (row + gap lock)
    });

    let nextSeq = 101;

    if (existing.length > 0) {
      const lastNo = existing[0][prefixStyle.field];
      const seqPart = lastNo.slice(prefix.length);
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    let candidate;
    if (prefixStyle.type === "QUOTATION") {
      candidate = `QUO${prefix}${nextSeq}`;
    } else if (prefixStyle.type === "ORDER") {
      candidate = `${prefix}${nextSeq}`;
    } else if (prefixStyle.type === "PURCHASE_ORDER") {
      candidate = `PO${prefix}${nextSeq}`;
    }

    // Check if already exists (critical!)
    const conflict = await transaction.model.findOne({
      where: { [prefixStyle.field]: candidate },
      transaction,
    });

    if (!conflict) {
      return candidate;
    }

    // Collision → retry with next number
    console.warn(
      `Number collision on ${candidate} — retrying (${attempt}/${MAX_ATTEMPTS})`
    );
  }

  throw new Error(
    `Failed to generate unique number after ${MAX_ATTEMPTS} attempts`
  );
}

// Usage helpers
const quotationStyle = {
  type: "QUOTATION",
  field: "reference_number",
  prefixLike: "QUO%",
};

const orderStyle = {
  type: "ORDER",
  field: "orderNo",
  prefixLike: "%",
};

const poStyle = {
  type: "PURCHASE_ORDER",
  field: "poNumber",
  prefixLike: "PO%",
};
