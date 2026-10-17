// Reorder suggestions: products whose free stock (available + incoming − still
// waiting on orders) is at or below their reorder point, grouped by vendor,
// with a suggested quantity and the last price paid.
//
//   reorder point = product alert quantity (or 10)
//   target        = 2 × reorder point
//   suggest       = target − (available + incoming − waiting), rounded up
const { QueryTypes } = require("sequelize");
const stock = require("./stock.service");

const m = () => require("../../models");
const SELLING_PRICE = "9ba862ef-f993-4873-95ef-1fef10036aa5";
const asList = (v) => {
  let x = v;
  for (let i = 0; i < 3 && typeof x === "string"; i++) {
    try {
      x = JSON.parse(x);
    } catch {
      return [];
    }
  }
  return Array.isArray(x) ? x : [];
};
const asObj = (v) => {
  let x = v;
  for (let i = 0; i < 3 && typeof x === "string"; i++) {
    try {
      x = JSON.parse(x);
    } catch {
      return {};
    }
  }
  return x && typeof x === "object" ? x : {};
};

/** Pieces still needed by confirmed orders beyond what is reserved for them, per product. */
async function waitingByProduct() {
  const { sequelize } = m();
  const orders = await sequelize.query(
    `SELECT o.id, o.products FROM orders o WHERE o.status IN (:holding)`,
    { replacements: { holding: stock.HOLDING_STATUSES }, type: QueryTypes.SELECT },
  );
  if (!orders.length) return {};
  const ids = orders.map((o) => o.id);
  const [dispatches, reservations] = await Promise.all([
    sequelize.query("SELECT orderId, items, status FROM order_dispatches WHERE orderId IN (:ids)", { replacements: { ids }, type: QueryTypes.SELECT }),
    sequelize.query("SELECT orderId, productId, SUM(quantity) AS q FROM stock_reservations WHERE status = 'ACTIVE' AND orderId IN (:ids) GROUP BY orderId, productId", {
      replacements: { ids },
      type: QueryTypes.SELECT,
    }),
  ]);
  const out = {};
  for (const o of orders) {
    const need = {};
    for (const l of asList(o.products)) {
      const pid = l.productId || l.id;
      if (pid) need[pid] = (need[pid] || 0) + (Number(l.quantity) || 0);
    }
    for (const d of dispatches.filter((x) => x.orderId === o.id && x.status !== "RETURNED"))
      for (const it of asList(d.items)) if (need[it.productId] != null) need[it.productId] -= Number(it.quantity) || 0;
    for (const r of reservations.filter((x) => x.orderId === o.id)) if (need[r.productId] != null) need[r.productId] -= Number(r.q) || 0;
    for (const [pid, n] of Object.entries(need)) if (n > 0) out[pid] = (out[pid] || 0) + n;
  }
  return out;
}

/** Last unit price paid per product (from purchase orders). */
async function lastPrices(productIds) {
  if (!productIds.length) return {};
  const PoItem = require("../purchase-order/models/po-item.model");
  const docs = await PoItem.find({ "items.productId": { $in: productIds } }).sort({ createdAt: -1 }).limit(500).lean().exec().catch(() => []);
  const out = {};
  for (const d of docs) for (const it of d.items || []) if (productIds.includes(it.productId) && out[it.productId] == null && it.unitPrice > 0) out[it.productId] = it.unitPrice;
  return out;
}

async function suggestions() {
  const { sequelize } = m();
  const rows = await sequelize.query(
    `SELECT p.productId, p.name, p.product_code AS code, p.alert_quantity, p.vendorId, p.meta,
            v.vendorName, b.brandName,
            SUM(COALESCE(sb.onHand,0)) AS onHand, SUM(COALESCE(sb.reserved,0)) AS reserved, SUM(COALESCE(sb.incoming,0)) AS incoming
     FROM products p
     LEFT JOIN stock_balances sb ON sb.productId = p.productId
     LEFT JOIN vendors v ON v.id = p.vendorId
     LEFT JOIN brands b ON b.id = p.brandId
     WHERE p.status IS NULL OR p.status NOT IN ('inactive','expired')
     GROUP BY p.productId, p.name, p.product_code, p.alert_quantity, p.vendorId, p.meta, v.vendorName, b.brandName`,
    { type: QueryTypes.SELECT },
  );
  const waiting = await waitingByProduct();
  const picks = [];
  for (const r of rows) {
    const available = Number(r.onHand) - Number(r.reserved);
    const incoming = Number(r.incoming);
    const wait = waiting[r.productId] || 0;
    const point = Number(r.alert_quantity) > 0 ? Number(r.alert_quantity) : 10;
    const free = available + incoming - wait;
    if (free > point) continue;
    const suggest = Math.max(Math.ceil(point * 2 - free), 1);
    picks.push({
      productId: r.productId,
      name: r.name,
      code: r.code,
      brand: r.brandName,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      available,
      incoming,
      waiting: wait,
      reorderPoint: point,
      suggest,
      sellingPrice: Number(asObj(r.meta)[SELLING_PRICE]) || 0,
    });
  }
  const prices = await lastPrices(picks.map((p) => p.productId));
  for (const p of picks) {
    p.lastPrice = prices[p.productId] || null;
    p.unitPrice = p.lastPrice || p.sellingPrice || null;
    p.priceFrom = p.lastPrice ? "last purchase" : p.sellingPrice ? "selling price — confirm with vendor" : "unknown";
    p.urgent = p.waiting > 0 && p.available <= 0;
  }
  const groups = {};
  for (const p of picks) {
    const k = p.vendorId || "none";
    groups[k] ||= { vendorId: p.vendorId || null, vendorName: p.vendorName || "No vendor set on product", items: [] };
    groups[k].items.push(p);
  }
  return Object.values(groups)
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.waiting - a.waiting || a.available - b.available),
      urgent: g.items.filter((i) => i.urgent).length,
      value: Math.round(g.items.reduce((s, i) => s + (i.unitPrice || 0) * i.suggest, 0)),
    }))
    .sort((a, b) => (a.vendorId ? 0 : 1) - (b.vendorId ? 0 : 1) || b.urgent - a.urgent || b.items.length - a.items.length);
}

module.exports = { suggestions, waitingByProduct };
