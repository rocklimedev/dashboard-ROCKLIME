// controllers/fieldGuidedSheetController.js

const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../../../config/database");
const {
  sendNotification,
} = require("../../engagement/notification.controller");
const { Product, Vendor, FieldGuidedSheet, User } = require("../../../models");
const FgsItem = require("../models/fgs-item.model"); // Mongoose model
const { createPurchaseOrderFromData } = require("../purchase-order.controller"); // ← Assume this exists or create it
const { ActivityLog } = require("../../../models");
const logActivity = require("../../../utils/activityLogger");
// Move to env or config in production
const ADMIN_USER_ID =
  process.env.ADMIN_USER_ID || "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

const FGS_STATUSES = {
  DRAFT: "draft",
  NEGOTIATING: "negotiating",
  APPROVED: "approved",
  CONVERTED: "converted",
  CANCELLED: "cancelled",
};

const VALID_FGS_STATUSES = Object.values(FGS_STATUSES);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function generateDailyFGSNumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY");

  let attempt = 0;
  const MAX_ATTEMPTS = 20;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    const lastFGS = await FieldGuidedSheet.findOne({
      where: {
        fgsNumber: { [Op.like]: `FGS${prefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: ["fgsNumber"],
      order: [["fgsNumber", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (lastFGS) {
      const lastSeq = lastFGS.fgsNumber.slice(9);
      const parsed = parseInt(lastSeq, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `FGS${prefix}${nextSeq}`;

    const conflict = await FieldGuidedSheet.findOne({
      where: { fgsNumber: candidate },
      transaction: t,
    });

    if (!conflict) return candidate;
  }

  throw new Error(
    `Failed to generate unique FGS number after ${MAX_ATTEMPTS} attempts`,
  );
}

async function validateAndCalculateItems(items, transaction) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items must be a non-empty array");
  }

  let total = 0;
  const prepared = [];

  for (const item of items) {
    if (!item.productId) throw new Error("Every item must have productId");

    const product = await Product.findByPk(item.productId, { transaction });
    if (!product) throw new Error(`Product not found: ${item.productId}`);

    const qty = Number(item.quantity);
    if (qty <= 0 || isNaN(qty))
      throw new Error(`Invalid quantity: ${item.productId}`);

    const price = Number(item.unitPrice ?? item.mrp ?? 0);
    if (price <= 0 || isNaN(price))
      throw new Error(`Invalid unit price: ${item.productId}`);

    const lineTotal = qty * price;
    total += lineTotal;

    let imageUrl = null;
    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0];
      } else if (typeof product.images === "string" && product.images.trim()) {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
        } catch {
          // silent fail
        }
      }
    }

    prepared.push({
      productId: item.productId,
      productName: product.name || "Unnamed",
      companyCode:
        product.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
      productCode: product.product_code || product.code || "",
      imageUrl,
      quantity: qty,
      unitPrice: price,
      mrp: Number(item.mrp ?? product.mrp ?? price),
      discount: Number(item.discount ?? 0),
      discountType: item.discountType || "percent",
      tax: Number(item.tax ?? 0),
      total: lineTotal,
    });
  }

  return {
    totalAmount: Number(total.toFixed(2)),
    preparedItems: prepared,
  };
}

async function fetchFgsItems(fgsId) {
  const doc = await FgsItem.findOne({ fgsId }).lean().exec();
  return doc?.items || [];
}

module.exports = {
  Op,
  moment,
  sequelize,
  sendNotification,
  Product,
  Vendor,
  FieldGuidedSheet,
  User,
  FgsItem,
  createPurchaseOrderFromData,
  ActivityLog,
  logActivity,
  ADMIN_USER_ID,
  FGS_STATUSES,
  VALID_FGS_STATUSES,
  generateDailyFGSNumber,
  validateAndCalculateItems,
  fetchFgsItems,
};
