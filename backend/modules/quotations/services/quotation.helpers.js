const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Op } = require("sequelize");
const sequelize = require("../../../config/database");
const { Product, Quotation, Customer, User } = require("../../../models");
const QuotationItem = require("../models/quotation-item.model"); // MongoDB model
const QuotationVersion = require("../models/quotation-version.model");
const { ActivityLog } = require("../../../models");
const logActivity = require("../../../utils/activityLogger");

// META_SLUGS (same as you have in your Cart controller)
const META_SLUGS = {
  sellingPrice: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  companyCode: "d11da9f9-3f2e-4536-8236-9671200cca4a",
  barcode: "4ded1cb3-5d31-42e8-90ec-a381a6ab1e35",
  productGroup: "81cd6d76-d7d2-4226-b48e-6704e6224c2b",
};

// Safe meta value extractor (reuse from your cart code)
const getMetaValue = (meta, uuid) => {
  if (!meta || !uuid) return null;

  let parsed = meta;
  if (typeof meta === "string") {
    try {
      parsed = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  return parsed[uuid] || null;
};
// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateGroupId() {
  return "grp-" + uuidv4().slice(0, 8);
}

function generateFloorId() {
  return "fl_" + uuidv4().slice(0, 8);
}

function generateRoomId(floorId = "") {
  return (floorId ? floorId + "_" : "rm_") + uuidv4().slice(0, 8);
}

function buildFloorsFromProducts(products) {
  const floorMap = new Map();

  products.forEach((item) => {
    const locationList = Array.isArray(item.locations)
      ? item.locations
      : item.floorId
        ? [{ floorId: item.floorId, floorName: item.floorName }]
        : [];

    locationList.forEach((loc) => {
      if (!loc.floorId) return;

      if (!floorMap.has(loc.floorId)) {
        floorMap.set(loc.floorId, {
          floorId: loc.floorId,
          floorName: loc.floorName || `Floor ${floorMap.size + 1}`,
          sortOrder: floorMap.size,
          rooms: [],
        });
      }

      const floor = floorMap.get(loc.floorId);
      if (loc.roomId && !floor.rooms.some((r) => r.roomId === loc.roomId)) {
        floor.rooms.push({
          roomId: loc.roomId,
          roomName: loc.roomName || "Unnamed Room",
          areas: [],
          sortOrder: floor.rooms.length,
        });
      }
    });
  });

  return Array.from(floorMap.values());
}
// Add this helper function at the top
const extractFirstImageUrl = (imagesField) => {
  if (!imagesField) return null;

  try {
    // Case 1: Already an array
    if (Array.isArray(imagesField)) {
      return imagesField[0] || null;
    }

    // Case 2: String that might be JSON
    if (typeof imagesField === "string") {
      const trimmed = imagesField.trim();

      // If it looks like a direct URL (not starting with [ or {)
      if (trimmed.startsWith("http")) {
        return trimmed;
      }

      // Try parsing as JSON
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed[0] || null;
      }

      if (typeof parsed === "string" && parsed.startsWith("http")) {
        return parsed;
      }
    }

    return null;
  } catch (err) {
    // Last resort: if it's a plain URL string with quotes or garbage
    const str = String(imagesField).trim();
    if (str.startsWith("http")) {
      return str.replace(/^["']|["']$/g, ""); // remove wrapping quotes
    }

    return null;
  }
};
function calculateTotals(
  items = [],
  extraDiscount = 0,
  extraDiscountType = "percent",
  shippingAmount = 0,
  gst = 0,
) {
  // STRONGER FILTERING FOR OPTIONAL ITEMS
  const mainItems = items.filter((item) => {
    const isOptional =
      Boolean(item.isOption) ||
      Boolean(item.isOptionFor) ||
      (item.optionType && item.optionType !== "main");

    return !isOptional;
  });

  const optionalItems = items.filter((item) => {
    return (
      Boolean(item.isOption) ||
      Boolean(item.isOptionFor) ||
      (item.optionType && item.optionType !== "main")
    );
  });

  let subTotal = 0;
  let totalItemDiscount = 0;
  let taxableAmount = 0;

  mainItems.forEach((p) => {
    const lineGross = (Number(p.price) || 0) * (Number(p.quantity) || 1);
    const discountAmount =
      p.discountType === "percent"
        ? (lineGross * (Number(p.discount) || 0)) / 100
        : (Number(p.discount) || 0) * (Number(p.quantity) || 1);

    const lineAfterDiscount = lineGross - discountAmount;

    subTotal += lineGross;
    totalItemDiscount += discountAmount;
    taxableAmount += lineAfterDiscount;
  });

  const baseForExtraDiscount = taxableAmount + Number(shippingAmount || 0);
  const extraDiscountAmount =
    extraDiscountType === "percent"
      ? (baseForExtraDiscount * Number(extraDiscount || 0)) / 100
      : Number(extraDiscount || 0);

  const amountBeforeGst = baseForExtraDiscount - extraDiscountAmount;
  const roundedAmount = Math.round(amountBeforeGst);
  const roundOff = roundedAmount - amountBeforeGst;

  const gstAmount = roundedAmount * (Number(gst || 0) / 100);
  const finalAmount = roundedAmount + gstAmount;

  const optionalTotal = optionalItems.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }, 0);

  return {
    subTotal: Number(subTotal.toFixed(2)),
    totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    extraDiscountAmount: Number(extraDiscountAmount.toFixed(2)),
    shippingAmount: Number(shippingAmount || 0),
    amountBeforeGst: Number(amountBeforeGst.toFixed(2)),
    roundOff: Number(roundOff.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),

    optionalItems,
    optionalTotal: Number(optionalTotal.toFixed(2)),
    optionalItemsCount: optionalItems.length,
  };
}
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

module.exports = {
  uuidv4,
  moment,
  Op,
  sequelize,
  Product,
  Quotation,
  Customer,
  User,
  QuotationItem,
  QuotationVersion,
  ActivityLog,
  logActivity,
  META_SLUGS,
  getMetaValue,
  generateGroupId,
  generateFloorId,
  generateRoomId,
  buildFloorsFromProducts,
  extractFirstImageUrl,
  calculateTotals,
  generateQuotationNumber,
};
