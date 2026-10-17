// controllers/purchaseOrderController.js

const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../../config/database");
const { sendNotification } = require("../engagement/notification.controller");
const { Product, Vendor, PurchaseOrder, User } = require("../../models");
const PoItem = require("./models/po-item.model"); // Mongoose model
const { ActivityLog } = require("../../models");
const logActivity = require("../../utils/activityLogger");

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
const stock = require("../stock/stock.service");

const COUNTS_AS_INCOMING = ["confirmed", "partial_delivered"];

/** Apply the stock side of a PO status change (see updatePurchaseOrderStatus). */
async function applyStatusStock(po, status, t, userId) {
  if (po.status === status) return;
  if (po.status === PO_STATUSES.DELIVERED) {
    throw new Error("This PO is already delivered; its stock has been received.");
  }
  if (status === PO_STATUSES.CONFIRMED && !COUNTS_AS_INCOMING.includes(po.status)) {
    await stock.poIncoming(po, await fetchPoItems(po.id), 1, { t, userId });
  }
  if (status === PO_STATUSES.DELIVERED) {
    const toReceive = (await remainingItems(po, t)).filter((i) => i.quantity > 0);
    if (toReceive.length) {
      await stock.receiveGoods({ po, items: toReceive, userId, notes: "Marked delivered" }, { t });
    }
  }
  if (status === PO_STATUSES.CANCELLED && COUNTS_AS_INCOMING.includes(po.status)) {
    const left = (await remainingItems(po, t)).filter((i) => i.quantity > 0);
    await stock.poIncoming(po, left, -1, { t, userId });
  }
}

/** Lines still to be received: ordered minus everything received so far. */
async function remainingItems(po, t) {
  const items = await fetchPoItems(po.id);
  const received = await stock.receivedForPo(po.id, t);
  return items
    .map((i) => ({
      productId: i.productId,
      productName: i.productName,
      ordered: Number(i.quantity) || 0,
      received: received[i.productId] || 0,
      quantity: Math.max((Number(i.quantity) || 0) - (received[i.productId] || 0), 0),
    }));
}

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

// PO header fields that come from the form (all optional)
const { poTotals } = require("../../lib/poMath");
function poHeader(body = {}) {
  const out = {};
  const str = (k, n) => {
    if (k in body) out[k] = body[k] === "" || body[k] == null ? null : String(body[k]).trim().slice(0, n);
  };
  str("vendorRef", 80);
  str("paymentTerms", 255);
  str("deliveryTerms", 255);
  str("notes", 4000);
  if ("warehouseId" in body) out.warehouseId = body.warehouseId || null;
  if ("freight" in body) out.freight = Math.max(Number(body.freight) || 0, 0);
  return out;
}
async function isInterState(vendor) {
  const company = await require("../settings/settings.service").getSetting("company");
  const norm = (x) => String(x || "").trim().toLowerCase();
  return Boolean(vendor?.state && company.state && norm(vendor.state) !== norm(company.state));
}
const totalsFields = (t) => ({
  totalAmount: t.grandTotal,
  subTotal: t.subTotal,
  discountTotal: t.discount,
  taxableValue: t.taxableValue,
  gstAmount: t.gstAmount,
  interState: t.interState,
  roundOff: t.roundOff,
});

async function validateAndCalculateItems(items, transaction, { freight = 0, interState = false } = {}) {
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

    const lineTotal = qty * price; // replaced by the full line total below
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

  // discount and GST per line, freight, CGST/SGST or IGST, round off
  const totals = poTotals({ items: prepared, freight, interState });
  totals.lines.forEach((l, i) => {
    prepared[i].total = l.total;
  });
  return {
    totalAmount: totals.grandTotal,
    preparedItems: prepared,
    totals,
  };
}

async function fetchPoItems(poId) {
  const doc = await PoItem.findOne({ poId }).lean().exec();
  return doc?.items || [];
}

// ─────────────────────────────────────────────────────────────
// CREATE Purchase Order
// ─────────────────────────────────────────────────────────────
exports.createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  let mongoDoc = null;

  try {
    const { vendorId, items, expectDeliveryDate, fgsId } = req.body;
    const userId = req.user?.userId || null; // ← from auth middleware

    if (!vendorId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "vendorId and non-empty items array required" });
    }

    const vendor = await Vendor.findByPk(vendorId, { transaction: t });
    if (!vendor) throw new Error("Vendor not found");

    const header = poHeader(req.body);
    const interState = await isInterState(vendor);
    const { totalAmount, preparedItems, totals } = await validateAndCalculateItems(items, t, { freight: header.freight || 0, interState });

    const poNumber = await generateDailyPONumber(t);

    const po = await PurchaseOrder.create(
      {
        poNumber,
        vendorId,
        userId,
        fgsId: fgsId || null,
        status: PO_STATUSES.PENDING,
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate
          ? new Date(expectDeliveryDate)
          : null,
        paymentTerms: vendor.paymentTerms || null,
        ...header,
        ...totalsFields(totals),
        totalAmount,
      },
      { transaction: t },
    );

    mongoDoc = await PoItem.create({
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      items: preparedItems,
      calculatedTotal: totalAmount,
    });

    await po.update(
      { mongoItemsId: mongoDoc._id.toString() },
      { transaction: t },
    );

    await t.commit();
    await logActivity({
      userId: userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "CREATE_PURCHASE_ORDER",
      entityId: po.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} created for ${vendor.vendorName}`,

      metadata: {
        poNumber: po.poNumber,
        vendorId: vendorId,
        vendorName: vendor.vendorName,
        totalAmount: totalAmount,
        itemCount: preparedItems.length,

        source: fgsId ? "FGS" : "DIRECT",
        fgsId: fgsId || null,

        mongoLinked: !!mongoDoc?._id,
        orderDate: po.orderDate,
        expectedDelivery: expectDeliveryDate || null,
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New PO Created — ${poNumber}`,
      message: `${vendor.vendorName || "Vendor"} • ₹${totalAmount} • ${fgsId ? "from FGS" : "direct"}`,
    });

    return res.status(201).json({
      message: "Purchase Order created",
      purchaseOrder: { ...po.toJSON(), items: preparedItems },
    });
  } catch (err) {
    await t.rollback();

    return res.status(500).json({
      message: "Failed to create Purchase Order",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE Purchase Order (items = full replacement)
// ─────────────────────────────────────────────────────────────
exports.updatePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, status, expectDeliveryDate } = req.body;
    const { id } = req.params;

    const po = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!po) throw new Error("Purchase order not found");

    if ([PO_STATUSES.DELIVERED, PO_STATUSES.CANCELLED].includes(po.status)) {
      throw new Error("Cannot modify delivered or cancelled Purchase Order");
    }

    const updateData = {};

    if (vendorId) {
      const v = await Vendor.findByPk(vendorId, { transaction: t });
      if (!v) throw new Error("Vendor not found");
      updateData.vendorId = vendorId;
    }

    if (status) {
      if (!VALID_PO_STATUSES.includes(status))
        throw new Error("Invalid status");
      updateData.status = status;
    }

    if (expectDeliveryDate !== undefined) {
      updateData.expectDeliveryDate = expectDeliveryDate
        ? new Date(expectDeliveryDate)
        : null;
    }
    Object.assign(updateData, poHeader(req.body));

    let returnedItems = null;

    const beforeRemaining = COUNTS_AS_INCOMING.includes(po.status)
      ? await remainingItems(po, t)
      : null;

    // freight or vendor changes also change the totals: recalculate from the saved lines
    const vendorNow = await Vendor.findByPk(updateData.vendorId || po.vendorId, { transaction: t });
    const freightNow = updateData.freight ?? Number(po.freight) ?? 0;
    const linesNow = Array.isArray(items) && items.length > 0 ? items : "freight" in updateData || updateData.vendorId ? await fetchPoItems(po.id) : null;
    if (linesNow && linesNow.length) {
      const { totalAmount, preparedItems, totals } = await validateAndCalculateItems(linesNow, t, {
        freight: freightNow,
        interState: await isInterState(vendorNow),
      });
      Object.assign(updateData, totalsFields(totals));
      updateData.totalAmount = totalAmount;

      await PoItem.findOneAndUpdate(
        { poId: po.id },
        {
          vendorId: updateData.vendorId || po.vendorId,
          items: preparedItems,
          calculatedTotal: totalAmount,
        },
        { upsert: true },
      );

      returnedItems = preparedItems;
    }

    // Keep Incoming in step with edited quantities on a confirmed PO
    if (beforeRemaining && returnedItems) {
      const after = await remainingItems(po, t);
      const was = Object.fromEntries(beforeRemaining.map((r) => [r.productId, r.quantity]));
      const now = Object.fromEntries(after.map((r) => [r.productId, r.quantity]));
      for (const pid of new Set([...Object.keys(was), ...Object.keys(now)])) {
        const diff = (now[pid] || 0) - (was[pid] || 0);
        if (!diff) continue;
        const wh = await stock.getDefaultWarehouse(t);
        await stock.post(t, {
          productId: pid,
          warehouseId: wh.id,
          movement: diff > 0 ? "INCOMING" : "INCOMING_CANCEL",
          incoming: diff,
          ref: { type: "PO", id: po.id, no: po.poNumber },
          userId: req.user?.userId || null,
          reason: `PO ${po.poNumber} quantities edited`,
        });
      }
    }
    if (updateData.status && updateData.status !== po.status) {
      await applyStatusStock(po, updateData.status, t, req.user?.userId || null);
    }

    await po.update(updateData, { transaction: t });

    const updated = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      transaction: t,
    });

    await t.commit();
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "UPDATE_PURCHASE_ORDER",
      entityId: updated.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} updated`,

      metadata: {
        poNumber: po.poNumber,

        // ── CHANGES ──
        changedFields: Object.keys(updateData),

        // ── STATUS IMPACT ──
        status: updateData.status || updated.status,

        // ── FINANCIAL IMPACT ──
        totalAmount: updated.totalAmount,

        // ── VENDOR CHANGE ──
        vendorId: updateData.vendorId || po.vendorId,
        vendorName: updated.vendor?.vendorName || null,

        // ── ITEM UPDATE ──
        itemsUpdated: !!items,
        itemCount: items?.length || updated.items?.length || 0,

        // ── DELIVERY ──
        expectedDelivery:
          updateData.expectDeliveryDate || po.expectDeliveryDate,
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Updated — ${po.poNumber}`,
      message: `Status: ${updated.status} • ${updated.vendor?.vendorName || "?"} • ₹${updated.totalAmount}`,
    });

    return res.json({
      message: "Purchase Order updated",
      purchaseOrder: {
        ...updated.toJSON(),
        items: returnedItems || (await fetchPoItems(id)),
      },
    });
  } catch (err) {
    await t.rollback();
    const code = err.message.includes("not found") ? 404 : 400;
    return res
      .status(code)
      .json({ message: "Update failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        {
          model: User,
          as: "createdBy", // ← change from "creator" to "createdBy"
          attributes: ["userId", "name", "email", "username"],
        },
      ],
    });

    if (!po)
      return res.status(404).json({ message: "Purchase order not found" });

    const items = await fetchPoItems(po.id);

    return res.json({
      ...po.toJSON(),
      items,
      createdBy: po.createdBy
        ? {
            userId: po.createdBy.userId,
            name: po.createdBy.name,
            email: po.createdBy.email,
            username: po.createdBy.username,
          }
        : null,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching PO", error: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET ALL (paginated)
// ─────────────────────────────────────────────────────────────
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // filters: status (comma list), vendor, search (PO no. or vendor), order date range; sort
    const where = {};
    if (req.query.status) where.status = { [Op.in]: String(req.query.status).split(",").filter((x) => VALID_PO_STATUSES.includes(x)) };
    if (req.query.vendorId) where.vendorId = req.query.vendorId;
    if (req.query.from || req.query.to) {
      where.orderDate = {};
      if (req.query.from) where.orderDate[Op.gte] = new Date(`${req.query.from}T00:00:00`);
      if (req.query.to) where.orderDate[Op.lte] = new Date(`${req.query.to}T23:59:59`);
    }
    const term = String(req.query.search || "").trim();
    if (term) where[Op.or] = [{ poNumber: { [Op.like]: `%${term}%` } }, { "$vendor.vendorName$": { [Op.like]: `%${term}%` } }];
    const SORT_FIELDS = { createdAt: "createdAt", orderDate: "orderDate", orderNumber: "poNumber", poNumber: "poNumber", totalAmount: "totalAmount", expectDeliveryDate: "expectDeliveryDate" };
    const sortField = SORT_FIELDS[req.query.sortField] || "createdAt";
    const sortOrder = String(req.query.sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        {
          model: User,
          as: "createdBy", // ← add this
          attributes: ["userId", "name", "email", "username"],
        },
      ],
      order: [[sortField, sortOrder]],
      limit,
      offset,
      subQuery: false,
    });

    const poIds = rows.map((r) => r.id);
    const mongoDocs = await PoItem.find({ poId: { $in: poIds } }).lean();

    const itemsMap = new Map(mongoDocs.map((d) => [d.poId, d.items || []]));

    const result = rows.map((po) => ({
      ...po.toJSON(),
      items: itemsMap.get(po.id) || [],
      createdBy: po.createdBy
        ? {
            userId: po.createdBy.userId,
            name: po.createdBy.name,
            email: po.createdBy.email,
            username: po.createdBy.username,
          }
        : null,
    }));

    return res.json({
      data: result,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error listing Purchase Orders",
      error: err.message, // ← send it to frontend during dev
      // remove this line in production
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
exports.deletePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: Vendor, as: "vendor" }],
      transaction: t,
    });

    if (!po) throw new Error("Not found");

    await po.destroy({ transaction: t });
    await PoItem.deleteOne({ poId: po.id });
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "DELETE_PURCHASE_ORDER",
      entityId: po.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} deleted`,

      oldValues: {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: po.vendor?.vendorName || null,
        totalAmount: po.totalAmount,
        status: po.status,
      },

      metadata: {
        vendorName: po.vendor?.vendorName || null,
        totalAmount: po.totalAmount,
        hasMongoItems: true,
        mongoDeleted: false, // we delete after commit logic-wise
        itemCount: null,
        warning: "PO permanently deleted",

        deletionType: "HARD_DELETE",
      },

      req,
    });
    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Deleted — ${po.poNumber}`,
      message: `${po.vendor?.vendorName || "Vendor"} • ${po.totalAmount}`,
    });

    return res.json({ message: "Purchase Order deleted successfully" });
  } catch (err) {
    await t.rollback();
    const code = err.message.includes("not found") ? 404 : 500;
    return res
      .status(code)
      .json({ message: "Delete failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// CONFIRM & UPDATE STOCK
// ─────────────────────────────────────────────────────────────
exports.confirmPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, { transaction: t });
    if (!po) throw new Error("Purchase order not found");

    if (
      po.status !== PO_STATUSES.PENDING &&
      po.status !== PO_STATUSES.CONFIRMED
    ) {
      throw new Error("Can only confirm pending or confirmed orders");
    }

    const items = await fetchPoItems(po.id);
    if (items.length === 0) throw new Error("No items in PO");

    // Receive whatever is still outstanding (one goods receipt)
    const toReceive = (await remainingItems(po, t)).filter((i) => i.quantity > 0);
    if (toReceive.length) {
      await stock.receiveGoods(
        { po, items: toReceive, userId: req.user?.userId || null, notes: "Received in full (confirm)" },
        { t },
      );
    }

    await po.update({ status: PO_STATUSES.DELIVERED }, { transaction: t });

    const vendor = await Vendor.findByPk(po.vendorId, { transaction: t });

    await t.commit();
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "CONFIRM_PURCHASE_ORDER",
      entityId: po.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} confirmed and marked as delivered`,

      oldValues: {
        status: po.status,
      },

      newValues: {
        status: PO_STATUSES.DELIVERED,
      },

      metadata: {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: vendor?.vendorName || null,

        totalAmount: po.totalAmount,

        itemCount: items.length,

        stockUpdated: true,

        stockImpact: items.map((i) => ({
          productId: i.productId,
          quantityAdded: i.quantity,
        })),

        deliveryType: "PO_CONFIRMATION",
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Confirmed & Delivered — ${po.poNumber}`,
      message: `${vendor?.vendorName || "?"} • ₹${po.totalAmount}`,
    });

    return res.json({
      message: "Purchase Order confirmed and stock updated",
      purchaseOrder: { ...po.toJSON(), status: PO_STATUSES.DELIVERED },
    });
  } catch (err) {
    await t.rollback();
    return res
      .status(400)
      .json({ message: "Confirmation failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE STATUS ONLY
// ─────────────────────────────────────────────────────────────
exports.updatePurchaseOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !VALID_PO_STATUSES.includes(status)) {
      throw new Error(
        `Invalid status. Allowed: ${VALID_PO_STATUSES.join(", ")}`,
      );
    }

    const po = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!po) throw new Error("Purchase order not found");

    if (po.status === status) throw new Error("Status already set");

    // Stock follows the PO:
    //   confirmed  -> quantities count as Incoming
    //   delivered  -> everything not yet received is received now
    //   cancelled  -> what was never received leaves Incoming
    // Part deliveries are recorded with "Receive goods" (POST /:id/receive).
    await applyStatusStock(po, status, t, req.user?.userId || null);

    const oldStatus = po.status;
    await po.update({ status }, { transaction: t });

    const vendor = await Vendor.findByPk(po.vendorId, { transaction: t });

    await t.commit();
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "UPDATE_PO_STATUS",
      entityId: po.id,
      entityName: po.poNumber,
      description: `PO ${po.poNumber} status changed from ${oldStatus} to ${status}`,

      oldValues: {
        status: oldStatus,
      },

      newValues: {
        status,
      },

      metadata: {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: vendor?.vendorName || null,

        stockUpdated:
          status === PO_STATUSES.DELIVERED &&
          oldStatus !== PO_STATUSES.DELIVERED,

        stockImpact:
          status === PO_STATUSES.DELIVERED &&
          oldStatus !== PO_STATUSES.DELIVERED
            ? "INCREMENTED_FROM_PO_ITEMS"
            : null,

        transitionType: `${oldStatus}_TO_${status}`,
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Status Changed — ${po.poNumber}`,
      message: `${oldStatus} → ${status} • ${vendor?.vendorName || "?"}`,
    });

    return res.json({
      message: `Status updated to ${status}`,
      purchaseOrder: { ...po.toJSON(), status },
    });
  } catch (err) {
    await t.rollback();
    return res
      .status(400)
      .json({ message: "Status update failed", error: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET BY VENDOR
// ─────────────────────────────────────────────────────────────
exports.getPurchaseOrdersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { vendorId },
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const poIds = purchaseOrders.map((po) => po.id);
    const itemDocs = await PoItem.find({ poId: { $in: poIds } }).lean();

    const itemsMap = new Map(itemDocs.map((d) => [d.poId, d.items || []]));

    const result = purchaseOrders.map((po) => ({
      ...po.toJSON(),
      items: itemsMap.get(po.id) || [],
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase orders by vendor",
      error: error.message,
    });
  }
};
// Utility to create PO from data (used by FGS conversion + maybe others)
exports.createPurchaseOrderFromData = async (data, transaction = null) => {
  const t = transaction || (await sequelize.transaction());
  let mongoDoc = null;
  let shouldCommit = !transaction;

  try {
    const { vendorId, items, expectDeliveryDate, fgsId, createdBy } = data;

    if (!vendorId || !Array.isArray(items) || items.length === 0) {
      throw new Error("vendorId and non-empty items array required");
    }

    const vendor = await Vendor.findByPk(vendorId, { transaction: t });
    if (!vendor) throw new Error("Vendor not found");

    const { totalAmount, preparedItems } = await validateAndCalculateItems(
      items,
      t,
    );

    const poNumber = await generateDailyPONumber(t);

    const po = await PurchaseOrder.create(
      {
        poNumber,
        vendorId,
        userId: createdBy || null,
        fgsId: fgsId || null,
        status: PO_STATUSES.PENDING,
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate
          ? new Date(expectDeliveryDate)
          : null,
        totalAmount,
      },
      { transaction: t },
    );

    // Fixed: no second argument / no fake session
    mongoDoc = await PoItem.create({
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      items: preparedItems,
      calculatedTotal: totalAmount,
    });

    await po.update(
      { mongoItemsId: mongoDoc._id.toString() },
      { transaction: t },
    );

    if (shouldCommit) {
      await t.commit();

      await logActivity({
        userId: createdBy || null,
        contextTag: "PROCUREMENT",
        subContext: "PURCHASE_ORDER",
        action: "CREATE_PO_FROM_SERVICE",
        entityId: po.id,
        entityName: po.poNumber,
        description: `Purchase Order ${po.poNumber} created via service layer`,

        metadata: {
          poNumber: po.poNumber,
          vendorId,
          vendorName: vendor.vendorName || null,

          totalAmount,
          itemCount: preparedItems.length,

          source: fgsId ? "FGS" : "DIRECT",
          fgsId: fgsId || null,

          mongoLinked: !!mongoDoc?._id,
          serviceLayer: true,
        },
      });
    }
    return {
      purchaseOrder: { ...po.toJSON(), items: preparedItems },
      poNumber: po.poNumber,
    };
  } catch (err) {
    if (shouldCommit) await t.rollback();

    if (mongoDoc?._id) {
      await PoItem.deleteOne({ _id: mongoDoc._id }).catch(console.error);
    }

    throw err;
  }
};
module.exports = exports;


// ─────────────────────────────────────────────────────────────
// RECEIVE GOODS (part or full) against a PO
// POST /api/purchase-orders/:id/receive
// body: { items: [{ productId, quantity, damaged? }], warehouseId?, notes? }
// ─────────────────────────────────────────────────────────────
exports.receivePurchaseOrder = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const po = await PurchaseOrder.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!po) throw new stock.StockError("Purchase order not found", 404);
      if ([PO_STATUSES.CANCELLED, PO_STATUSES.DELIVERED].includes(po.status)) {
        throw new stock.StockError(`Cannot receive goods on a ${po.status} PO.`);
      }
      const remaining = await remainingItems(po, t);
      const byId = Object.fromEntries(remaining.map((r) => [r.productId, r]));
      const items = (req.body.items || []).map((i) => {
        const line = byId[i.productId];
        if (!line) throw new stock.StockError(`Product ${i.productId} is not on this PO.`);
        const qty = Math.max(Number(i.quantity) || 0, 0);
        const bad = Math.max(Number(i.damaged) || 0, 0);
        if (qty + bad > line.quantity) {
          throw new stock.StockError(`Only ${line.quantity} of "${line.productName}" are still to be received.`);
        }
        return { productId: i.productId, productName: line.productName, quantity: qty, damaged: bad };
      });
      const { grn, allocations } = await stock.receiveGoods(
        { po, items, warehouseId: req.body.warehouseId || null, userId: req.user?.userId || null, notes: req.body.notes || null },
        { t },
      );
      const after = await remainingItems(po, t);
      const allIn = after.every((r) => r.quantity === 0);
      await po.update({ status: allIn ? PO_STATUSES.DELIVERED : PO_STATUSES.PARTIAL_DELIVERED }, { transaction: t });
      return { grn, po, remaining: after, ordersFilled: allocations.filter((a) => a.lines.some((l) => l.reserved > 0)).length };
    });
    return res.status(201).json({ message: `Goods received (${result.grn.grnNo})`, ...result });
  } catch (err) {
    return res.status(err.status || 400).json({ message: err.message });
  }
};

// GET /api/purchase-orders/:id/receipts — goods receipts and what is still due
exports.getPurchaseOrderReceipts = async (req, res) => {
  try {
    const { GoodsReceipt, GoodsReceiptItem } = require("../../models");
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    const receipts = await GoodsReceipt.findAll({
      where: { poId: po.id },
      include: [{ model: GoodsReceiptItem, as: "items" }],
      order: [["receivedAt", "DESC"]],
    });
    return res.json({ receipts, remaining: await remainingItems(po) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
