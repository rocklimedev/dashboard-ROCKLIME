// controllers/purchaseOrderController.js

const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../../../config/database");
const {
  sendNotification,
} = require("../../engagement/notification.controller");
const { Product, Vendor, PurchaseOrder, User } = require("../../../models");
const PoItem = require("../../products/models/po-item.model"); // Mongoose model
const { ActivityLog } = require("../../../models");
const logActivity = require("../../../utils/activityLogger");

// Preferably move to .env
const ADMIN_USER_ID =
  process.env.ADMIN_USER_ID || "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

const PO_STATUSES = {
  PENDING: "pending",
  IN_NEGOTIATION: "in_negotiation",
  CONFIRMED: "confirmed",
  PARTIAL_DELIVERED: "partial_delivered",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const VALID_PO_STATUSES = Object.values(PO_STATUSES);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function generateDailyPONumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY");

  let attempt = 0;
  const MAX_ATTEMPTS = 20;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    const lastPO = await PurchaseOrder.findOne({
      where: {
        poNumber: { [Op.like]: `PO${prefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: ["poNumber"],
      order: [["poNumber", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (lastPO) {
      const lastSeq = lastPO.poNumber.slice(8);
      const parsed = parseInt(lastSeq, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `PO${prefix}${nextSeq}`;

    const conflict = await PurchaseOrder.findOne({
      where: { poNumber: candidate },
      transaction: t,
    });

    if (!conflict) return candidate;
  }

  throw new Error(
    `Failed to generate unique PO number after ${MAX_ATTEMPTS} attempts`,
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
        } catch {}
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

async function fetchPoItems(poId) {
  const doc = await PoItem.findOne({ poId }).lean().exec();
  return doc?.items || [];
}

module.exports = {
  Op,
  moment,
  sequelize,
  sendNotification,
  Product,
  Vendor,
  PurchaseOrder,
  User,
  PoItem,
  ActivityLog,
  logActivity,
  ADMIN_USER_ID,
  PO_STATUSES,
  VALID_PO_STATUSES,
  generateDailyPONumber,
  validateAndCalculateItems,
  fetchPoItems,
};
