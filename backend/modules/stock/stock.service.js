// ---------------------------------------------------------------------------
// Stock engine
//
// Every product has, per godown (warehouse):
//   onHand    good stock physically in the godown
//   reserved  part of onHand held for confirmed orders, not yet dispatched
//   incoming  on confirmed purchase orders, not yet received
//   damaged   returned/broken pieces kept apart
//   available = onHand - reserved   (what sales can still promise)
//
// All changes go through post(), which locks the balance row, refuses to let
// any number go negative (or available below zero), writes one stock_ledger
// line, and keeps products.quantity equal to the total AVAILABLE stock so the
// existing screens show what can still be sold.
//
// Order rules:
//   - DRAFT orders reserve nothing.
//   - Confirmed orders (PREPARING ... PARTIALLY_DISPATCHED, ONHOLD) reserve up
//     to what they still need (ordered - dispatched), as far as stock allows;
//     the rest is a backorder that fills automatically when goods arrive.
//   - Dispatch takes stock out of onHand (and out of the order's reservation).
//   - Cancelling / closing / delivering releases whatever is still reserved.
// ---------------------------------------------------------------------------
const { Op } = require("sequelize");

const HOLDING_STATUSES = [
  "PREPARING",
  "CHECKING",
  "INVOICE",
  "PARTIALLY_DISPATCHED",
  "ONHOLD",
];

const ONHOLD_DAYS = Number(process.env.ONHOLD_RELEASE_DAYS) || 7;

const HISTORY_ACTION = {
  OPENING: "correction",
  RECEIPT: "add-stock",
  DISPATCH: "sale",
  RETURN: "return",
  ADJUST: "adjustment",
  COUNT: "adjustment",
  TRANSFER_OUT: "adjustment",
  TRANSFER_IN: "adjustment",
  DAMAGE: "adjustment",
};

class StockError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const models = () => require("../../models");

const asList = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const lineProductId = (line) => line?.productId || line?.id || null;

// ---------------------------------------------------------------------------
// Warehouses
// ---------------------------------------------------------------------------
async function getDefaultWarehouse(t) {
  const { Warehouse } = models();
  let wh = await Warehouse.findOne({ where: { isDefault: true, active: true }, transaction: t });
  if (!wh) wh = await Warehouse.findOne({ where: { active: true }, order: [["createdAt", "ASC"]], transaction: t });
  if (!wh) {
    wh = await Warehouse.create({ code: "MAIN", name: "Main godown", isDefault: true, active: true }, { transaction: t });
  }
  return wh;
}

async function resolveWarehouseId(warehouseId, t) {
  if (warehouseId) {
    const { Warehouse } = models();
    const wh = await Warehouse.findByPk(warehouseId, { transaction: t });
    if (!wh || !wh.active) throw new StockError("Godown not found or inactive", 404);
    return wh.id;
  }
  return (await getDefaultWarehouse(t)).id;
}

// ---------------------------------------------------------------------------
// Balances and the ledger
// ---------------------------------------------------------------------------
async function lockBalance(productId, warehouseId, t) {
  const { StockBalance } = models();
  let bal = await StockBalance.findOne({
    where: { productId, warehouseId },
    transaction: t,
    lock: t.LOCK.UPDATE,
  });
  if (!bal) {
    await StockBalance.findOrCreate({
      where: { productId, warehouseId },
      defaults: { productId, warehouseId },
      transaction: t,
    });
    bal = await StockBalance.findOne({
      where: { productId, warehouseId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
  }
  return bal;
}

/** Keep products.quantity = total available, and flip active <-> out_of_stock. */
async function syncProductQuantity(productId, t) {
  const { StockBalance, Product, sequelize } = models();
  const row = await StockBalance.findOne({
    attributes: [
      [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.literal("onHand - reserved")), 0), "available"],
    ],
    where: { productId },
    raw: true,
    transaction: t,
  });
  const available = Number(row?.available || 0);
  const product = await Product.findByPk(productId, { attributes: ["productId", "quantity", "status"], transaction: t });
  if (!product) return available;
  const changes = { quantity: available };
  if (product.status === "active" && available <= 0) changes.status = "out_of_stock";
  if (product.status === "out_of_stock" && available > 0) changes.status = "active";
  await Product.update(changes, { where: { productId }, transaction: t });
  return available;
}

/**
 * Apply one movement to one product in one godown.
 * changes: { onHand, reserved, incoming, damaged } (signed deltas)
 */
async function post(t, {
  productId,
  warehouseId,
  movement,
  onHand = 0,
  reserved = 0,
  incoming = 0,
  damaged = 0,
  ref = {},
  userId = null,
  reason = null,
  key = null,
}) {
  if (!t) throw new Error("stock.post needs a transaction");
  const { StockLedger, InventoryHistory, Product } = models();

  if (key) {
    const seen = await StockLedger.findOne({ where: { idempotencyKey: key }, transaction: t });
    if (seen) return { skipped: true, ledger: seen };
  }

  const product = await Product.findByPk(productId, { attributes: ["productId", "name"], transaction: t });
  if (!product) throw new StockError(`Product not found: ${productId}`, 404);

  const bal = await lockBalance(productId, warehouseId, t);
  const next = {
    onHand: bal.onHand + onHand,
    reserved: bal.reserved + reserved,
    incoming: bal.incoming + incoming,
    damaged: bal.damaged + damaged,
  };
  const name = product.name || productId;
  if (next.onHand < 0) throw new StockError(`Not enough stock of "${name}": ${bal.onHand} on hand.`, 409, { productId, onHand: bal.onHand });
  if (next.reserved < 0) throw new StockError(`Reservation for "${name}" would go below zero.`, 409, { productId });
  if (next.incoming < 0) next.incoming = 0; // receiving more than was on order
  if (next.damaged < 0) throw new StockError(`Not enough damaged stock of "${name}".`, 409, { productId });
  if (next.onHand - next.reserved < 0) {
    throw new StockError(
      `Not enough available stock of "${name}": ${bal.onHand - bal.reserved} available (${bal.reserved} reserved for orders).`,
      409,
      { productId, available: bal.onHand - bal.reserved },
    );
  }

  const applied = {
    onHand: next.onHand - bal.onHand,
    reserved: next.reserved - bal.reserved,
    incoming: next.incoming - bal.incoming,
    damaged: next.damaged - bal.damaged,
  };
  await bal.update(next, { transaction: t });

  const ledger = await StockLedger.create(
    {
      productId,
      warehouseId,
      movement,
      onHandChange: applied.onHand,
      reservedChange: applied.reserved,
      incomingChange: applied.incoming,
      damagedChange: applied.damaged,
      onHandAfter: next.onHand,
      reservedAfter: next.reserved,
      incomingAfter: next.incoming,
      damagedAfter: next.damaged,
      refType: ref.type || null,
      refId: ref.id ? String(ref.id) : null,
      refNo: ref.no ? String(ref.no) : null,
      userId,
      reason,
      idempotencyKey: key,
    },
    { transaction: t },
  );

  const availableTotal = await syncProductQuantity(productId, t);

  // The old "stock history" screen reads inventory_history; keep it filled
  // for movements that change what is physically on hand.
  if (applied.onHand !== 0 && HISTORY_ACTION[movement]) {
    await InventoryHistory.create(
      {
        productId,
        change: applied.onHand,
        quantityAfter: availableTotal,
        action: HISTORY_ACTION[movement],
        orderNo: ref.no ? String(ref.no).slice(0, 50) : null,
        userId,
        message: reason || `${movement}${ref.no ? ` (${ref.type || ""} ${ref.no})` : ""}`,
      },
      { transaction: t },
    );
  }

  return { ledger, balance: next, applied };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------
async function productStock(productId, { t } = {}) {
  const { StockBalance, StockReservation, Warehouse } = models();
  const [balances, reservations] = await Promise.all([
    StockBalance.findAll({
      where: { productId },
      include: [{ model: Warehouse, as: "warehouse", attributes: ["id", "code", "name"] }],
      transaction: t,
    }),
    StockReservation.findAll({ where: { productId, status: "ACTIVE", quantity: { [Op.gt]: 0 } }, transaction: t }),
  ]);
  const totals = balances.reduce(
    (a, b) => ({
      onHand: a.onHand + b.onHand,
      reserved: a.reserved + b.reserved,
      incoming: a.incoming + b.incoming,
      damaged: a.damaged + b.damaged,
    }),
    { onHand: 0, reserved: 0, incoming: 0, damaged: 0 },
  );
  totals.available = totals.onHand - totals.reserved;
  return { totals, balances, reservations };
}

async function availableIn(productId, warehouseId, t) {
  const { StockBalance } = models();
  const b = await StockBalance.findOne({ where: { productId, warehouseId }, transaction: t });
  return b ? b.onHand - b.reserved : 0;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** What an order still needs per product: ordered - dispatched. */
async function orderNeeds(order, t) {
  const { OrderDispatch } = models();
  const ordered = {};
  for (const line of asList(order.products)) {
    const pid = lineProductId(line);
    if (!pid) continue;
    ordered[pid] = (ordered[pid] || 0) + (Number(line.quantity) || 0);
  }
  const dispatched = {};
  const dispatches = await OrderDispatch.findAll({ where: { orderId: order.id }, attributes: ["items", "status"], transaction: t });
  for (const d of dispatches) {
    if (d.status === "RETURNED") continue;
    for (const item of asList(d.items)) {
      if (!item.productId) continue;
      dispatched[item.productId] = (dispatched[item.productId] || 0) + (Number(item.quantity) || 0);
    }
  }
  const ids = new Set([...Object.keys(ordered), ...Object.keys(dispatched)]);
  return [...ids].sort().map((productId) => ({
    productId,
    ordered: ordered[productId] || 0,
    dispatched: dispatched[productId] || 0,
    needed: Math.max((ordered[productId] || 0) - (dispatched[productId] || 0), 0),
  }));
}

/**
 * Bring an order's reservations in line with its status and lines.
 * Safe to call any number of times. Returns per-line stock status.
 */
async function syncOrder(orderId, { t, userId = null, release = false } = {}) {
  const { Order, StockReservation, Warehouse } = models();
  const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!order) throw new StockError("Order not found", 404);

  const statusUp = String(order.status).toUpperCase();
  // On-hold orders keep their stock for ONHOLD_DAYS, then release it.
  const heldTooLong =
    statusUp === "ONHOLD" &&
    Date.now() - new Date(order.updatedAt).getTime() > ONHOLD_DAYS * 864e5;
  const holds = !release && HOLDING_STATUSES.includes(statusUp) && !heldTooLong;
  const needs = await orderNeeds(order, t);
  const defaultWh = await getDefaultWarehouse(t);
  const warehouses = await Warehouse.findAll({ where: { active: true }, transaction: t });
  const whOrder = [defaultWh.id, ...warehouses.map((w) => w.id).filter((id) => id !== defaultWh.id)];

  const existing = await StockReservation.findAll({
    where: { orderId: order.id, status: "ACTIVE" },
    transaction: t,
  });
  const ref = { type: "ORDER", id: order.id, no: order.orderNo };

  // Products no longer on the order: release
  const needIds = new Set(needs.map((n) => n.productId));
  for (const r of existing) {
    if (!needIds.has(r.productId) && r.quantity > 0) {
      await post(t, { productId: r.productId, warehouseId: r.warehouseId, movement: "RELEASE", reserved: -r.quantity, ref, userId, reason: "Removed from order" });
      await r.update({ quantity: 0, status: "RELEASED" }, { transaction: t });
    }
  }

  const lines = [];
  for (const need of needs) {
    const target = holds ? need.needed : 0;
    const mine = existing.filter((r) => r.productId === need.productId);
    let current = mine.reduce((s, r) => s + r.quantity, 0);

    if (current > target) {
      // Release the surplus, non-default godowns first
      let surplus = current - target;
      const ordered = [...mine].sort((a, b) => whOrder.indexOf(b.warehouseId) - whOrder.indexOf(a.warehouseId));
      for (const r of ordered) {
        if (surplus <= 0) break;
        const take = Math.min(r.quantity, surplus);
        if (take <= 0) continue;
        await post(t, { productId: need.productId, warehouseId: r.warehouseId, movement: "RELEASE", reserved: -take, ref, userId, reason: holds ? "Order quantity reduced" : `Order ${order.status.toLowerCase()}` });
        await r.update({ quantity: r.quantity - take, status: r.quantity - take > 0 ? "ACTIVE" : "RELEASED" }, { transaction: t });
        surplus -= take;
      }
      current = target;
    } else if (current < target) {
      // Reserve what we can, default godown first
      let missing = target - current;
      for (const whId of whOrder) {
        if (missing <= 0) break;
        const free = await availableIn(need.productId, whId, t);
        const take = Math.min(free, missing);
        if (take <= 0) continue;
        await post(t, { productId: need.productId, warehouseId: whId, movement: "RESERVE", reserved: take, ref, userId, reason: "Reserved for order" });
        const [row] = await StockReservation.findOrCreate({
          where: { orderId: order.id, productId: need.productId, warehouseId: whId },
          defaults: { orderId: order.id, orderNo: order.orderNo, productId: need.productId, warehouseId: whId, quantity: 0, status: "ACTIVE" },
          transaction: t,
        });
        await row.update({ quantity: (row.status === "ACTIVE" ? row.quantity : 0) + take, status: "ACTIVE" }, { transaction: t });
        missing -= take;
        current += take;
      }
    }

    lines.push({
      productId: need.productId,
      ordered: need.ordered,
      dispatched: need.dispatched,
      reserved: current,
      backordered: holds ? Math.max(need.needed - current, 0) : 0,
    });
  }
  return { orderId: order.id, status: order.status, holds, lines };
}

/** Release everything an order holds (cancel, delete). */
const releaseOrder = (orderId, opts) => syncOrder(orderId, { ...opts, release: true });

/**
 * Take dispatched goods out of stock: first from the order's reservation,
 * then from free stock. items: [{ productId, quantity }]
 */
async function dispatchOut(order, items, { t, userId = null, dispatchId, dispatchNo } = {}) {
  const { StockReservation } = models();
  const defaultWh = await getDefaultWarehouse(t);
  const ref = { type: "DISPATCH", id: dispatchId || order.id, no: dispatchNo ? `${order.orderNo}/D${dispatchNo}` : order.orderNo };

  const merged = {};
  for (const i of items) {
    const pid = lineProductId(i);
    if (!pid) continue;
    merged[pid] = (merged[pid] || 0) + (Number(i.quantity) || 0);
  }

  for (const productId of Object.keys(merged).sort()) {
    let left = merged[productId];
    if (left <= 0) continue;
    const reservations = await StockReservation.findAll({
      where: { orderId: order.id, productId, status: "ACTIVE", quantity: { [Op.gt]: 0 } },
      transaction: t,
    });
    reservations.sort((a, b) => (a.warehouseId === defaultWh.id ? -1 : b.warehouseId === defaultWh.id ? 1 : 0));
    for (const r of reservations) {
      if (left <= 0) break;
      const take = Math.min(r.quantity, left);
      await post(t, {
        productId,
        warehouseId: r.warehouseId,
        movement: "DISPATCH",
        onHand: -take,
        reserved: -take,
        ref,
        userId,
        reason: `Dispatched for order ${order.orderNo}`,
        key: dispatchId ? `DISPATCH:${dispatchId}:${productId}:${r.warehouseId}:R` : null,
      });
      await r.update({ quantity: r.quantity - take, status: r.quantity - take > 0 ? "ACTIVE" : "CONSUMED" }, { transaction: t });
      left -= take;
    }
    if (left > 0) {
      // Not reserved (e.g. backordered stock that has since arrived): use free stock
      const free = await availableIn(productId, defaultWh.id, t);
      if (free < left) {
        const { Product } = models();
        const p = await Product.findByPk(productId, { attributes: ["name"], transaction: t });
        throw new StockError(
          `Not enough stock to dispatch ${merged[productId]} of "${p?.name || productId}". Reserved for this order and free stock together cover ${merged[productId] - left + Math.max(free, 0)}.`,
          409,
          { productId },
        );
      }
      await post(t, {
        productId,
        warehouseId: defaultWh.id,
        movement: "DISPATCH",
        onHand: -left,
        ref,
        userId,
        reason: `Dispatched for order ${order.orderNo} (from free stock)`,
        key: dispatchId ? `DISPATCH:${dispatchId}:${productId}:${defaultWh.id}:F` : null,
      });
    }
  }
}

/** After goods arrive: confirmed orders waiting for these products get stock, oldest first (high priority first). */
async function allocateBackorders(productIds, { t, userId = null } = {}) {
  const { Order } = models();
  const wanted = new Set(productIds);
  if (!wanted.size) return [];
  const open = await Order.findAll({
    where: { status: { [Op.in]: HOLDING_STATUSES } },
    attributes: ["id", "products", "priority", "createdAt"],
    order: [["createdAt", "ASC"]],
    transaction: t,
  });
  const rank = { high: 0, medium: 1, low: 2 };
  const candidates = open
    .filter((o) => asList(o.products).some((l) => wanted.has(lineProductId(l))))
    .sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1) || new Date(a.createdAt) - new Date(b.createdAt));
  const results = [];
  for (const o of candidates) results.push(await syncOrder(o.id, { t, userId }));
  return results;
}

// ---------------------------------------------------------------------------
// Purchasing
// ---------------------------------------------------------------------------

/** A PO was confirmed with the vendor (sign = 1) or cancelled (sign = -1). */
async function poIncoming(po, items, sign, { t, userId = null, warehouseId = null } = {}) {
  const whId = await resolveWarehouseId(warehouseId, t);
  for (const i of items) {
    const q = Number(i.quantity) || 0;
    if (!i.productId || q <= 0) continue;
    await post(t, {
      productId: i.productId,
      warehouseId: whId,
      movement: sign > 0 ? "INCOMING" : "INCOMING_CANCEL",
      incoming: sign * q,
      ref: { type: "PO", id: po.id, no: po.poNumber },
      userId,
      reason: sign > 0 ? `On order: PO ${po.poNumber}` : `PO ${po.poNumber} cancelled or short-closed`,
      key: `PO:${po.id}:${i.productId}:${sign > 0 ? "IN" : "OUT"}`,
    });
  }
}

async function nextNumber(prefix, Model, field, t) {
  const d = new Date();
  const stamp = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(2)}`;
  const like = `${prefix}${stamp}%`;
  const count = await Model.count({ where: { [field]: { [Op.like]: like } }, transaction: t });
  return `${prefix}${stamp}${String(count + 1).padStart(3, "0")}`;
}

/**
 * Goods received. items: [{ productId, quantity, damaged?, productName? }]
 * Good pieces go on hand, damaged ones to Damaged; incoming goes down by both.
 */
async function receiveGoods({ po = null, items, warehouseId = null, userId = null, notes = null }, { t }) {
  const { GoodsReceipt, GoodsReceiptItem } = models();
  const whId = await resolveWarehouseId(warehouseId, t);
  const clean = items
    .map((i) => ({ ...i, quantity: Math.max(Number(i.quantity) || 0, 0), damaged: Math.max(Number(i.damaged) || 0, 0) }))
    .filter((i) => i.productId && i.quantity + i.damaged > 0);
  if (!clean.length) throw new StockError("Enter the quantity received for at least one item.");

  const grnNo = await nextNumber("GRN", GoodsReceipt, "grnNo", t);
  const grn = await GoodsReceipt.create(
    { grnNo, poId: po?.id || null, poNumber: po?.poNumber || null, vendorId: po?.vendorId || null, warehouseId: whId, userId, notes },
    { transaction: t },
  );
  for (const i of clean) {
    await GoodsReceiptItem.create(
      { grnId: grn.id, productId: i.productId, productName: i.productName || null, quantity: i.quantity, damaged: i.damaged },
      { transaction: t },
    );
    const bal = await lockBalance(i.productId, whId, t);
    await post(t, {
      productId: i.productId,
      warehouseId: whId,
      movement: "RECEIPT",
      onHand: i.quantity,
      damaged: i.damaged,
      incoming: po ? -Math.min(bal.incoming, i.quantity + i.damaged) : 0,
      ref: { type: "GRN", id: grn.id, no: grnNo },
      userId,
      reason: po ? `Received against PO ${po.poNumber}` : "Goods received",
    });
  }
  const allocations = await allocateBackorders(clean.map((i) => i.productId), { t, userId });
  return { grn, allocations };
}

/** Quantities already received per product for a PO. */
async function receivedForPo(poId, t) {
  const { GoodsReceipt, GoodsReceiptItem } = models();
  const grns = await GoodsReceipt.findAll({ where: { poId }, attributes: ["id"], transaction: t });
  if (!grns.length) return {};
  const items = await GoodsReceiptItem.findAll({ where: { grnId: grns.map((g) => g.id) }, transaction: t });
  return items.reduce((m, i) => ({ ...m, [i.productId]: (m[i.productId] || 0) + i.quantity + i.damaged }), {});
}

// ---------------------------------------------------------------------------
// Adjustments, counts, returns, transfers
// ---------------------------------------------------------------------------
async function adjust({ productId, warehouseId = null, change, reason, userId = null, movement = "ADJUST", ref = {} }, { t }) {
  const delta = Math.trunc(Number(change));
  if (!delta) throw new StockError("Enter a quantity to add or remove.");
  if (!reason || !String(reason).trim()) throw new StockError("A reason is required for every stock adjustment.");
  const whId = await resolveWarehouseId(warehouseId, t);
  return post(t, { productId, warehouseId: whId, movement, onHand: delta, ref: { type: "ADJUSTMENT", ...ref }, userId, reason: String(reason).trim() });
}

/** Set on-hand to a counted figure; the difference is posted as a COUNT movement. */
async function setOnHand({ productId, warehouseId = null, counted, reason, userId = null, ref = {} }, { t }) {
  const whId = await resolveWarehouseId(warehouseId, t);
  const bal = await lockBalance(productId, whId, t);
  const target = Math.max(Math.trunc(Number(counted) || 0), 0);
  const delta = target - bal.onHand;
  if (delta === 0) return { unchanged: true };
  if (target < bal.reserved) {
    // Fewer pieces than are promised: release the newest reservations first
    await releaseShortfall(productId, whId, bal.reserved - target, { t, userId });
  }
  return post(t, { productId, warehouseId: whId, movement: "COUNT", onHand: delta, ref: { type: "COUNT", ...ref }, userId, reason: reason || `Stock set to ${target} by count` });
}

/** When stock is found missing, take reservations back from the newest orders. */
async function releaseShortfall(productId, warehouseId, qty, { t, userId }) {
  const { StockReservation } = models();
  const rows = await StockReservation.findAll({
    where: { productId, warehouseId, status: "ACTIVE", quantity: { [Op.gt]: 0 } },
    order: [["createdAt", "DESC"]],
    transaction: t,
  });
  let left = qty;
  for (const r of rows) {
    if (left <= 0) break;
    const take = Math.min(r.quantity, left);
    await post(t, { productId, warehouseId, movement: "RELEASE", reserved: -take, ref: { type: "ORDER", id: r.orderId, no: r.orderNo }, userId, reason: "Released: counted stock is lower than reserved" });
    await r.update({ quantity: r.quantity - take, status: r.quantity - take > 0 ? "ACTIVE" : "RELEASED" }, { transaction: t });
    left -= take;
  }
}

/** Customer return: good pieces back on hand, damaged ones to Damaged. */
async function returnIn({ productId, quantity, damaged = 0, warehouseId = null, ref = {}, userId = null, reason = null, key = null }, { t }) {
  const whId = await resolveWarehouseId(warehouseId, t);
  return post(t, {
    productId,
    warehouseId: whId,
    movement: "RETURN",
    onHand: Math.max(Number(quantity) || 0, 0),
    damaged: Math.max(Number(damaged) || 0, 0),
    ref,
    userId,
    reason: reason || "Customer return",
    key,
  });
}

/** Undo a return (e.g. a cancelled credit note). */
async function returnOut({ productId, quantity, damaged = 0, warehouseId = null, ref = {}, userId = null, reason = null, key = null }, { t }) {
  const whId = await resolveWarehouseId(warehouseId, t);
  return post(t, {
    productId,
    warehouseId: whId,
    movement: "RETURN_REVERSED",
    onHand: -Math.max(Number(quantity) || 0, 0),
    damaged: -Math.max(Number(damaged) || 0, 0),
    ref,
    userId,
    reason: reason || "Return reversed",
    key,
  });
}

async function transfer({ productId, fromWarehouseId, toWarehouseId, quantity, userId = null, reason = null }, { t }) {
  const q = Math.trunc(Number(quantity) || 0);
  if (q <= 0) throw new StockError("Enter a quantity to transfer.");
  if (fromWarehouseId === toWarehouseId) throw new StockError("Choose two different godowns.");
  const from = await resolveWarehouseId(fromWarehouseId, t);
  const to = await resolveWarehouseId(toWarehouseId, t);
  const ref = { type: "TRANSFER", no: `${q}` };
  await post(t, { productId, warehouseId: from, movement: "TRANSFER_OUT", onHand: -q, ref, userId, reason: reason || "Transfer out" });
  await post(t, { productId, warehouseId: to, movement: "TRANSFER_IN", onHand: q, ref, userId, reason: reason || "Transfer in" });
}

/** Daily job: on-hold orders past ONHOLD_DAYS give their stock back. */
async function releaseStaleOnHold({ userId = null } = {}) {
  const { Order, StockReservation, sequelize } = models();
  const cutoff = new Date(Date.now() - ONHOLD_DAYS * 864e5);
  const stale = await Order.findAll({ where: { status: "ONHOLD", updatedAt: { [Op.lt]: cutoff } }, attributes: ["id", "orderNo", "createdBy"] });
  let released = 0;
  for (const o of stale) {
    const active = await StockReservation.count({ where: { orderId: o.id, status: "ACTIVE", quantity: { [Op.gt]: 0 } } });
    if (!active) continue;
    await sequelize.transaction((t) => syncOrder(o.id, { t, userId }));
    released++;
    try {
      const { sendNotification } = require("../engagement/notification.controller");
      if (o.createdBy) await sendNotification({ userId: o.createdBy, title: "Stock released", message: `Order ${o.orderNo} was on hold for over ${ONHOLD_DAYS} days, so its reserved stock was released.` });
    } catch {}
  }
  return released;
}

module.exports = {
  HOLDING_STATUSES,
  ONHOLD_DAYS,
  releaseStaleOnHold,
  StockError,
  getDefaultWarehouse,
  resolveWarehouseId,
  post,
  productStock,
  orderNeeds,
  syncOrder,
  releaseOrder,
  dispatchOut,
  allocateBackorders,
  poIncoming,
  receiveGoods,
  receivedForPo,
  adjust,
  setOnHand,
  returnIn,
  returnOut,
  transfer,
  syncProductQuantity,
};
