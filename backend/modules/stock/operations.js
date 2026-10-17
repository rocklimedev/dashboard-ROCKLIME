// Operations app: the godown's day in one place.
//
//   board()                 GET  /api/stock/ops/board        what to pack, what is on the road,
//                                                            what is arriving, what needs attention
//   entry(body, user)       POST /api/stock/ops/entry        quick stock entry: add, remove,
//                                                            mark damaged, repair, write off, move godown
//   receivable()            GET  /api/stock/ops/receivable   purchase orders with goods still to arrive
//   gatePasses(query)       GET  /api/stock/ops/gate-passes  every dispatch with its gate pass
const { Op, QueryTypes } = require("sequelize");
const stock = require("./stock.service");

const m = () => require("../../models");
const TO_DISPATCH = ["PREPARING", "CHECKING", "INVOICE", "PARTIALLY_DISPATCHED"];
const ON_ROAD = ["DISPATCHED", "IN_TRANSIT", "PENDING"];
const today = () => new Date().toISOString().slice(0, 10);
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

async function board() {
  const { sequelize } = m();
  const q = (sql, r = {}) => sequelize.query(sql, { replacements: r, type: QueryTypes.SELECT });

  const [orders, onRoad, pos, moves, counts, low, damaged] = await Promise.all([
    q(
      `SELECT o.id, o.orderNo, o.status, o.priority, o.dueDate, o.createdAt, o.products, c.name AS customer,
              (SELECT COALESCE(SUM(r.quantity),0) FROM stock_reservations r WHERE r.orderId = o.id AND r.status = 'ACTIVE') AS reserved,
              (SELECT COALESCE(SUM(d.totalQuantity),0) FROM order_dispatches d WHERE d.orderId = o.id AND d.status <> 'RETURNED') AS dispatched
       FROM orders o LEFT JOIN customers c ON c.customerId = o.createdFor
       WHERE o.status IN (:st)
       ORDER BY (o.dueDate IS NULL), o.dueDate ASC, o.createdAt ASC`,
      { st: TO_DISPATCH },
    ),
    q(
      `SELECT d.id, d.orderId, d.orderNo, d.dispatchNumber, d.totalQuantity, d.status, d.vehicleNo, d.driverName, d.driverPhone,
              d.dispatchDate, d.createdAt, d.gatePassLink, c.name AS customer
       FROM order_dispatches d JOIN orders o ON o.id = d.orderId LEFT JOIN customers c ON c.customerId = o.createdFor
       WHERE d.deliveredAt IS NULL AND d.status NOT IN ('DELIVERED','RETURNED','CANCELLED')
         AND o.status NOT IN ('DELIVERED','CLOSED','CANCELED','RETURNED')
       ORDER BY d.createdAt DESC LIMIT 50`,
    ).catch(() => []),
    q(
      `SELECT p.id, p.poNumber, p.status, p.expectDeliveryDate, p.orderDate, v.vendorName AS vendor
       FROM purchase_orders p LEFT JOIN vendors v ON v.id = p.vendorId
       WHERE p.status IN ('confirmed','partial_delivered')
       ORDER BY (p.expectDeliveryDate IS NULL), p.expectDeliveryDate ASC LIMIT 50`,
    ).catch(() => []),
    q(
      `SELECT l.id, l.movement, l.onHandChange, l.damagedChange, l.refType, l.refNo, l.reason, l.createdAt, p.name AS product, p.productId, u.name AS user
       FROM stock_ledger l JOIN products p ON p.productId = l.productId LEFT JOIN users u ON u.userId = l.userId
       WHERE l.onHandChange <> 0 OR l.damagedChange <> 0
       ORDER BY l.createdAt DESC LIMIT 12`,
    ).catch(() => []),
    q("SELECT COUNT(*) AS n FROM stock_counts WHERE status NOT IN ('APPROVED','CANCELLED')").catch(() => [{ n: 0 }]),
    require("./reorder").suggestions().catch(() => []),
    q("SELECT COUNT(DISTINCT productId) AS n, COALESCE(SUM(damaged),0) AS pcs FROM stock_balances WHERE damaged > 0").catch(() => [{ n: 0, pcs: 0 }]),
  ]);

  const todayStr = today();
  const toDispatch = orders.map((o) => {
    const ordered = asList(o.products).reduce((a, l) => a + (Number(l.quantity) || 0), 0);
    const left = Math.max(ordered - Number(o.dispatched), 0);
    const reserved = Number(o.reserved) || 0;
    return {
      id: o.id,
      orderNo: o.orderNo,
      customer: o.customer,
      status: o.status,
      priority: o.priority,
      dueDate: o.dueDate,
      late: !!o.dueDate && String(o.dueDate).slice(0, 10) < todayStr,
      left,
      reserved: Math.min(reserved, left),
      ready: left > 0 && reserved >= left,
    };
  });

  const receivedRows = pos.length
    ? await q(
        `SELECT g.poId, COALESCE(SUM(i.quantity + COALESCE(i.damaged,0)),0) AS received
         FROM goods_receipts g JOIN goods_receipt_items i ON i.grnId = g.id WHERE g.poId IN (:ids) GROUP BY g.poId`,
        { ids: pos.map((p) => p.id) },
      ).catch(() => [])
    : [];
  const recv = Object.fromEntries(receivedRows.map((r) => [r.poId, Number(r.received)]));

  const lowCount = low.reduce((a, g) => a + (g.items?.length || 0), 0);
  const movementsToday = moves.filter((x) => String(new Date(x.createdAt).toISOString()).slice(0, 10) === todayStr).length;

  return {
    counts: {
      toDispatch: toDispatch.length,
      readyToPack: toDispatch.filter((o) => o.ready).length,
      waitingForStock: toDispatch.filter((o) => !o.ready).length,
      late: toDispatch.filter((o) => o.late).length,
      onRoad: onRoad.length,
      toReceive: pos.length,
      lowStock: lowCount,
      damagedProducts: Number(damaged[0]?.n) || 0,
      damagedPieces: Number(damaged[0]?.pcs) || 0,
      openCounts: Number(counts[0]?.n) || 0,
      movementsToday,
    },
    toDispatch: toDispatch.slice(0, 12),
    onRoad: onRoad.slice(0, 12).map((d) => ({ ...d, totalQuantity: Number(d.totalQuantity) || 0 })),
    toReceive: pos.slice(0, 12).map((p) => ({
      ...p,
      late: !!p.expectDeliveryDate && String(p.expectDeliveryDate).slice(0, 10) < todayStr,
      receivedSoFar: recv[p.id] || 0,
    })),
    recentMoves: moves.map((x) => ({ ...x, onHandChange: Number(x.onHandChange), damagedChange: Number(x.damagedChange) })),
  };
}

const ENTRY_TYPES = {
  IN: "Add stock",
  OUT: "Remove stock",
  DAMAGE: "Mark damaged",
  REPAIR: "Back to good stock",
  WRITE_OFF: "Write off damaged",
  MOVE: "Move to another godown",
};

/** One quick stock entry. Every entry needs a reason and leaves a ledger line. */
async function entry(body, userId) {
  const { sequelize } = m();
  const type = String(body.type || "").toUpperCase();
  if (!ENTRY_TYPES[type]) throw new stock.StockError("Choose what you are doing with the stock.");
  const qty = Math.trunc(Number(body.quantity) || 0);
  if (qty <= 0) throw new stock.StockError("Enter how many pieces.");
  const reason = String(body.reason || "").trim();
  if (!reason) throw new stock.StockError("Write a reason, e.g. \"found 2 extra in rack B\" or \"broken while unloading\".");
  if (!body.productId) throw new stock.StockError("Choose a product.");

  return sequelize.transaction(async (t) => {
    const wh = await stock.resolveWarehouseId(body.warehouseId || null, t);
    const ref = { type: "STOCK_ENTRY", no: ENTRY_TYPES[type] };
    let r;
    if (type === "IN" || type === "OUT") {
      r = await stock.adjust({ productId: body.productId, warehouseId: wh, change: type === "IN" ? qty : -qty, reason, userId, ref }, { t });
      if (type === "IN") await stock.allocateBackorders([body.productId], { t, userId });
    } else if (type === "DAMAGE") {
      r = await stock.post(t, { productId: body.productId, warehouseId: wh, movement: "DAMAGE", onHand: -qty, damaged: qty, ref, userId, reason });
    } else if (type === "REPAIR") {
      r = await stock.post(t, { productId: body.productId, warehouseId: wh, movement: "ADJUST", onHand: qty, damaged: -qty, ref, userId, reason });
      await stock.allocateBackorders([body.productId], { t, userId });
    } else if (type === "WRITE_OFF") {
      r = await stock.post(t, { productId: body.productId, warehouseId: wh, movement: "WRITE_OFF", damaged: -qty, ref, userId, reason });
    } else {
      if (!body.toWarehouseId || body.toWarehouseId === wh) throw new stock.StockError("Choose the godown to move the stock to.");
      await stock.transfer({ productId: body.productId, fromWarehouseId: wh, toWarehouseId: body.toWarehouseId, quantity: qty, userId, reason }, { t });
      return { message: `${qty} moved`, type };
    }
    return { message: `${ENTRY_TYPES[type]}: ${qty} pcs`, type, balance: r.balance };
  });
}

async function receivable() {
  const { sequelize } = m();
  const rows = await sequelize.query(
    `SELECT p.id, p.poNumber, p.status, p.orderDate, p.expectDeliveryDate, p.totalAmount, v.vendorName AS vendor
     FROM purchase_orders p LEFT JOIN vendors v ON v.id = p.vendorId
     WHERE p.status IN ('confirmed','partial_delivered')
     ORDER BY (p.expectDeliveryDate IS NULL), p.expectDeliveryDate ASC, p.orderDate ASC`,
    { type: QueryTypes.SELECT },
  );
  const t = today();
  return rows.map((r) => ({ ...r, late: !!r.expectDeliveryDate && String(r.expectDeliveryDate).slice(0, 10) < t }));
}

async function gatePasses({ from, to, search, page = 1, limit = 50 } = {}) {
  const { sequelize } = m();
  const where = ["1=1"];
  const r = {};
  if (from) {
    where.push("DATE(COALESCE(d.dispatchDate, d.createdAt)) >= :from");
    r.from = from;
  }
  if (to) {
    where.push("DATE(COALESCE(d.dispatchDate, d.createdAt)) <= :to");
    r.to = to;
  }
  if (search) {
    where.push("(d.orderNo LIKE :s OR c.name LIKE :s OR d.vehicleNo LIKE :s OR d.lrNumber LIKE :s)");
    r.s = `%${String(search).trim()}%`;
  }
  const lim = Math.min(Number(limit) || 50, 200);
  const off = (Math.max(Number(page) || 1, 1) - 1) * lim;
  const sql = `FROM order_dispatches d JOIN orders o ON o.id = d.orderId LEFT JOIN customers c ON c.customerId = o.createdFor WHERE ${where.join(" AND ")}`;
  const [rows, total] = await Promise.all([
    sequelize.query(
      `SELECT d.id, d.orderId, d.orderNo, d.dispatchNumber, d.totalQuantity, d.status, d.vehicleNo, d.driverName, d.transporter, d.lrNumber,
              d.dispatchDate, d.createdAt, d.deliveredAt, d.gatePassLink, d.invoiceLink, c.name AS customer ${sql}
       ORDER BY COALESCE(d.dispatchDate, d.createdAt) DESC LIMIT ${lim} OFFSET ${off}`,
      { replacements: r, type: QueryTypes.SELECT },
    ),
    sequelize.query(`SELECT COUNT(*) AS n ${sql}`, { replacements: r, type: QueryTypes.SELECT }),
  ]);
  const { gatePassLink } = require("../orders/gate-pass");
  return {
    data: rows.map((d) => ({
      ...d,
      gpNo: `GP-${d.orderNo}-${d.dispatchNumber}`,
      totalQuantity: Number(d.totalQuantity) || 0,
      // every dispatch can print the standard gate pass, even when an uploaded one exists
      printLink: gatePassLink(d),
      uploaded: d.gatePassLink && !String(d.gatePassLink).includes("/public/gp/") ? d.gatePassLink : null,
    })),
    total: Number(total[0]?.n) || 0,
  };
}

module.exports = { board, entry, receivable, gatePasses, ENTRY_TYPES, TO_DISPATCH, ON_ROAD, Op };
