// Builds the first stock balances from the old single `products.quantity`.
//
// Until now, creating an order took stock off `quantity` straight away, even
// though nothing had left the godown. So what is physically on hand is
//   quantity + everything still undispatched on orders that are not
//   cancelled and not yet dispatched/delivered/closed.
// Confirmed orders then reserve their undispatched quantities again; drafts
// give theirs back. Open purchase orders become Incoming.
//
// This is a best guess from the records. At go-live, a physical count
// (Inventory -> Stock count) sets the real figures.
const { Op } = require("sequelize");
const stock = require("./stock.service");

const STILL_IN_GODOWN = ["DRAFT", ...stock.HOLDING_STATUSES];

async function buildOpeningBalances({ userId = null, force = false, log = console.log } = {}) {
  const m = require("../../models");
  const { sequelize, Product, Order, StockBalance, PurchaseOrder } = m;

  const existing = await StockBalance.count();
  if (existing && !force) {
    log(`Stock balances already exist (${existing} rows) — opening skipped.`);
    return { skipped: true };
  }

  return sequelize.transaction(async (t) => {
    const wh = await stock.getDefaultWarehouse(t);

    // 1. Undispatched quantities on orders whose stock was taken at creation
    const orders = await Order.findAll({ where: { status: { [Op.in]: STILL_IN_GODOWN } }, transaction: t });
    const held = {};
    for (const o of orders) {
      for (const n of await stock.orderNeeds(o, t)) {
        held[n.productId] = (held[n.productId] || 0) + n.needed;
      }
    }

    // 2. On hand = old quantity + held
    const products = await Product.findAll({ attributes: ["productId", "quantity"], transaction: t });
    let opened = 0;
    for (const p of products) {
      const onHand = Math.max(Number(p.quantity) || 0, 0) + (held[p.productId] || 0);
      if (onHand <= 0) continue;
      await stock.post(t, {
        productId: p.productId,
        warehouseId: wh.id,
        movement: "OPENING",
        onHand,
        ref: { type: "MIGRATION", no: "opening" },
        userId,
        reason: "Opening balance from the old stock figure plus undispatched order quantities",
        key: `OPENING:${p.productId}`,
      });
      opened++;
    }

    // 3. Confirmed orders reserve again, oldest first
    const holding = orders
      .filter((o) => stock.HOLDING_STATUSES.includes(o.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let backordered = 0;
    for (const o of holding) {
      const r = await stock.syncOrder(o.id, { t, userId });
      backordered += r.lines.reduce((s, l) => s + l.backordered, 0);
    }

    // 4. Open purchase orders count as incoming
    const pos = await PurchaseOrder.findAll({ where: { status: { [Op.in]: ["confirmed", "partial_delivered"] } }, transaction: t });
    const PoItem = require("../purchase-order/models/po-item.model");
    for (const po of pos) {
      const doc = await PoItem.findOne({ poId: po.id }).lean().exec();
      await stock.poIncoming(po, doc?.items || [], 1, { t, userId });
    }

    log(`Opening balances: ${opened} products, ${holding.length} confirmed orders re-reserved (${backordered} pieces backordered), ${pos.length} open POs as incoming.`);
    return { opened, orders: holding.length, backordered, purchaseOrders: pos.length };
  });
}

module.exports = { buildOpeningBalances };
