// HTTP handlers for the stock engine: live stock, reservations, movements,
// adjustments, transfers, godowns and physical stock counts.
const { Op, QueryTypes } = require("sequelize");
const stock = require("./stock.service");
const { productCompanyCode } = require("../../lib/productCompanyCode");

const m = () => require("../../models");
const fail = (res, err) =>
  res.status(err.status || 500).json({ message: err.message || "Stock request failed", details: err.details });

// ---------------------------------------------------------------------------
// Live stock list: On hand / Reserved / Available / Incoming / Damaged
// GET /api/stock/overview?search=&warehouseId=&filter=low|out|reserved|incoming|damaged&page=&limit=
// ---------------------------------------------------------------------------
exports.overview = async (req, res) => {
  try {
    const { sequelize } = m();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
    const search = String(req.query.search || "").trim();
    const wh = req.query.warehouseId || null;
    const filter = String(req.query.filter || "");

    const where = ["1=1"];
    const repl = { limit, offset: (page - 1) * limit };
    if (search) {
      where.push("(p.name LIKE :q OR p.product_code LIKE :q OR CAST(p.meta AS CHAR) LIKE :q)");
      repl.q = `%${search}%`;
    }
    const join = wh ? "LEFT JOIN stock_balances b ON b.productId = p.productId AND b.warehouseId = :wh" : "LEFT JOIN stock_balances b ON b.productId = p.productId";
    if (wh) repl.wh = wh;
    const having = {
      low: "HAVING (SUM(COALESCE(b.onHand,0)) - SUM(COALESCE(b.reserved,0))) <= COALESCE(NULLIF(MAX(p.alert_quantity),0),10)",
      out: "HAVING (SUM(COALESCE(b.onHand,0)) - SUM(COALESCE(b.reserved,0))) <= 0",
      reserved: "HAVING SUM(COALESCE(b.reserved,0)) > 0",
      incoming: "HAVING SUM(COALESCE(b.incoming,0)) > 0",
      damaged: "HAVING SUM(COALESCE(b.damaged,0)) > 0",
    }[filter] || "";

    const base = `
      FROM products p
      ${join}
      LEFT JOIN brands br ON br.id = p.brandId
      WHERE ${where.join(" AND ")}
      GROUP BY p.productId`;
    const rows = await sequelize.query(
      `SELECT p.productId, p.name, p.product_code, p.alert_quantity, p.images, br.brandName,
              COALESCE(SUM(b.onHand),0) AS onHand, COALESCE(SUM(b.reserved),0) AS reserved,
              COALESCE(SUM(b.incoming),0) AS incoming, COALESCE(SUM(b.damaged),0) AS damaged,
              COALESCE(SUM(b.onHand),0) - COALESCE(SUM(b.reserved),0) AS available
       ${base} ${having}
       ORDER BY p.name ASC
       LIMIT :limit OFFSET :offset`,
      { replacements: repl, type: QueryTypes.SELECT },
    );
    const [{ total }] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM (SELECT p.productId ${base} ${having}) x`,
      { replacements: repl, type: QueryTypes.SELECT },
    );
    const [sums] = await sequelize.query(
      `SELECT COALESCE(SUM(onHand),0) onHand, COALESCE(SUM(reserved),0) reserved, COALESCE(SUM(incoming),0) incoming, COALESCE(SUM(damaged),0) damaged
       FROM stock_balances ${wh ? "WHERE warehouseId = :wh" : ""}`,
      { replacements: repl, type: QueryTypes.SELECT },
    );
    const num = (v) => Number(v || 0);
    res.json({
      data: rows.map((r) => ({
        ...r,
        images: (() => { try { const v = typeof r.images === "string" ? JSON.parse(r.images) : r.images; return Array.isArray(v) ? v : typeof v === "string" ? JSON.parse(v) : []; } catch { return []; } })(),
        onHand: num(r.onHand), reserved: num(r.reserved), incoming: num(r.incoming), damaged: num(r.damaged), available: num(r.available),
        lowAt: num(r.alert_quantity) || 10,
      })),
      totals: { onHand: num(sums.onHand), reserved: num(sums.reserved), incoming: num(sums.incoming), damaged: num(sums.damaged), available: num(sums.onHand) - num(sums.reserved) },
      pagination: { page, limit, total: num(total), totalPages: Math.ceil(num(total) / limit) },
    });
  } catch (err) {
    fail(res, err);
  }
};

// ---------------------------------------------------------------------------
// Availability for many products at once (quotation builder, cart, catalogue)
// POST /api/stock/availability { productIds: [...] }
//   → { data: { [productId]: { onHand, reserved, available, incoming, damaged, lowAt, nextIncoming } } }
// ---------------------------------------------------------------------------
exports.availability = async (req, res) => {
  try {
    const { sequelize, Product, PurchaseOrder } = m();
    const ids = [...new Set((req.body?.productIds || []).filter((x) => typeof x === "string"))].slice(0, 1000);
    if (!ids.length) return res.json({ data: {} });
    const rows = await sequelize.query(
      `SELECT productId, COALESCE(SUM(onHand),0) onHand, COALESCE(SUM(reserved),0) reserved,
              COALESCE(SUM(incoming),0) incoming, COALESCE(SUM(damaged),0) damaged
       FROM stock_balances WHERE productId IN (:ids) GROUP BY productId`,
      { replacements: { ids }, type: QueryTypes.SELECT },
    );
    const products = await Product.findAll({ where: { productId: ids }, attributes: ["productId", "alert_quantity"] });
    const lowAt = Object.fromEntries(products.map((p) => [p.productId, Number(p.alert_quantity) || 10]));
    const num = (v) => Number(v || 0);
    const out = {};
    for (const id of ids) out[id] = { onHand: 0, reserved: 0, available: 0, incoming: 0, damaged: 0, lowAt: lowAt[id] || 10, nextIncoming: null };
    for (const r of rows) {
      out[r.productId] = {
        ...out[r.productId],
        onHand: num(r.onHand),
        reserved: num(r.reserved),
        incoming: num(r.incoming),
        damaged: num(r.damaged),
        available: num(r.onHand) - num(r.reserved),
      };
    }
    // Earliest expected date among open purchase orders, for products with stock coming
    const coming = ids.filter((id) => out[id].incoming > 0);
    if (coming.length) {
      const PoItem = require("../purchase-order/models/po-item.model");
      const pos = await PurchaseOrder.findAll({
        where: { status: { [Op.in]: ["confirmed", "partial_delivered"] } },
        attributes: ["id", "expectDeliveryDate"],
      });
      const docs = pos.length ? await PoItem.find({ poId: { $in: pos.map((p) => p.id) } }).lean().exec() : [];
      const due = Object.fromEntries(pos.map((p) => [p.id, p.expectDeliveryDate]));
      for (const d of docs) {
        for (const it of d.items || []) {
          if (!out[it.productId] || !due[d.poId]) continue;
          const cur = out[it.productId].nextIncoming;
          if (!cur || new Date(due[d.poId]) < new Date(cur)) out[it.productId].nextIncoming = due[d.poId];
        }
      }
    }
    res.json({ data: out });
  } catch (err) {
    fail(res, err);
  }
};

// ---------------------------------------------------------------------------
// One product: balances per godown, who it is reserved for, what is coming, movements
// GET /api/stock/products/:productId
// ---------------------------------------------------------------------------
exports.productDetail = async (req, res) => {
  try {
    const { Product, Order, Customer, User, StockLedger, Warehouse, PurchaseOrder } = m();
    const { productId } = req.params;
    const product = await Product.findByPk(productId, { attributes: ["productId", "name", "product_code", "alert_quantity", "quantity"] });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { totals, balances, reservations } = await stock.productStock(productId);
    const orders = reservations.length
      ? await Order.findAll({
          where: { id: reservations.map((r) => r.orderId) },
          attributes: ["id", "orderNo", "status", "priority", "createdAt", "createdBy", "assignedUserId"],
          include: [{ model: Customer, as: "customer", attributes: ["customerId", "name"] }],
        })
      : [];
    const userIds = [...new Set(orders.flatMap((o) => [o.createdBy, o.assignedUserId]).filter(Boolean))];
    const users = userIds.length ? await User.findAll({ where: { userId: userIds }, attributes: ["userId", "name", "username"] }) : [];
    const userName = Object.fromEntries(users.map((u) => [u.userId, u.name || u.username]));
    const orderById = Object.fromEntries(orders.map((o) => [o.id, o]));
    const whs = await Warehouse.findAll({ attributes: ["id", "code", "name"] });
    const whName = Object.fromEntries(whs.map((w) => [w.id, w.name]));

    const reservedFor = reservations
      .map((r) => {
        const o = orderById[r.orderId];
        return {
          orderId: r.orderId,
          orderNo: o?.orderNo || r.orderNo,
          status: o?.status,
          priority: o?.priority,
          customer: o?.customer?.name || null,
          quantity: r.quantity,
          warehouse: whName[r.warehouseId] || null,
          since: r.updatedAt,
          salesperson: userName[o?.assignedUserId] || userName[o?.createdBy] || null,
        };
      })
      .sort((a, b) => new Date(a.since) - new Date(b.since));

    // Incoming: open confirmed POs that include this product
    const PoItem = require("../purchase-order/models/po-item.model");
    const openPos = await PurchaseOrder.findAll({
      where: { status: { [Op.in]: ["confirmed", "partial_delivered"] } },
      attributes: ["id", "poNumber", "status", "expectDeliveryDate", "vendorId"],
    });
    const incoming = [];
    for (const po of openPos) {
      const doc = await PoItem.findOne({ poId: po.id }).lean().exec();
      const line = (doc?.items || []).find((i) => i.productId === productId);
      if (!line) continue;
      const received = (await stock.receivedForPo(po.id))[productId] || 0;
      const left = Math.max((Number(line.quantity) || 0) - received, 0);
      if (left > 0) incoming.push({ poId: po.id, poNumber: po.poNumber, status: po.status, expected: po.expectDeliveryDate, quantity: left });
    }

    const ledger = await StockLedger.findAll({
      where: { productId },
      order: [["createdAt", "DESC"]],
      limit: Math.min(parseInt(req.query.limit, 10) || 50, 500),
    });
    const ledgerUsers = [...new Set(ledger.map((l) => l.userId).filter(Boolean))];
    const lu = ledgerUsers.length ? await User.findAll({ where: { userId: ledgerUsers }, attributes: ["userId", "name", "username"] }) : [];
    const luName = Object.fromEntries(lu.map((u) => [u.userId, u.name || u.username]));

    res.json({
      product,
      totals: { ...totals, lowAt: Number(product.alert_quantity) || 10 },
      balances: balances.map((b) => ({ warehouseId: b.warehouseId, warehouse: b.warehouse?.name, onHand: b.onHand, reserved: b.reserved, available: b.onHand - b.reserved, incoming: b.incoming, damaged: b.damaged })),
      reservedFor,
      incoming,
      ledger: ledger.map((l) => ({ ...l.toJSON(), warehouse: whName[l.warehouseId] || null, user: luName[l.userId] || null })),
    });
  } catch (err) {
    fail(res, err);
  }
};

// ---------------------------------------------------------------------------
// Stock status of one order's lines: ordered / dispatched / reserved / backordered
// GET /api/stock/orders/:orderId
// ---------------------------------------------------------------------------
async function readOrderStock(orderId) {
  const { Order, StockReservation, Product } = m();
  const order = await Order.findByPk(orderId);
  if (!order) throw new stock.StockError("Order not found", 404);
  const needs = await stock.orderNeeds(order);
  const res = await StockReservation.findAll({ where: { orderId, status: "ACTIVE" } });
  const reserved = res.reduce((a, r) => ({ ...a, [r.productId]: (a[r.productId] || 0) + r.quantity }), {});
  const holds = stock.HOLDING_STATUSES.includes(order.status);
  const products = needs.length
    ? await Product.findAll({ where: { productId: needs.map((n) => n.productId) }, attributes: ["productId", "name", "quantity"] })
    : [];
  const pmap = Object.fromEntries(products.map((p) => [p.productId, p]));
  return {
    orderId,
    orderNo: order.orderNo,
    status: order.status,
    holds,
    lines: needs.map((n) => ({
      ...n,
      name: pmap[n.productId]?.name,
      reserved: reserved[n.productId] || 0,
      backordered: holds ? Math.max(n.needed - (reserved[n.productId] || 0), 0) : 0,
      availableNow: Number(pmap[n.productId]?.quantity || 0),
    })),
  };
}
exports.readOrderStock = readOrderStock;

exports.orderStock = async (req, res) => {
  try {
    res.json(await readOrderStock(req.params.orderId));
  } catch (err) {
    fail(res, err);
  }
};

// POST /api/stock/orders/:orderId/resync — re-run reservations for one order
exports.resyncOrder = async (req, res) => {
  try {
    const { sequelize } = m();
    const result = await sequelize.transaction((t) => stock.syncOrder(req.params.orderId, { t, userId: req.user.userId }));
    res.json(result);
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/stock/backorders — confirmed order lines still waiting for stock
exports.backorders = async (req, res) => {
  try {
    const { Order, Customer } = m();
    const orders = await Order.findAll({
      where: { status: { [Op.in]: stock.HOLDING_STATUSES } },
      attributes: ["id", "orderNo", "status", "priority", "createdAt", "dueDate"],
      include: [{ model: Customer, as: "customer", attributes: ["name"] }],
      order: [["createdAt", "ASC"]],
    });
    const out = [];
    for (const o of orders) {
      const s = await readOrderStock(o.id);
      for (const l of s.lines.filter((x) => x.backordered > 0)) {
        out.push({ orderId: o.id, orderNo: o.orderNo, customer: o.customer?.name, priority: o.priority, dueDate: o.dueDate, createdAt: o.createdAt, ...l });
      }
    }
    res.json({ data: out });
  } catch (err) {
    fail(res, err);
  }
};

// ---------------------------------------------------------------------------
// Changes
// ---------------------------------------------------------------------------
const inTx = (fn) => async (req, res) => {
  try {
    const { sequelize } = m();
    const result = await sequelize.transaction((t) => fn(req, t));
    res.status(201).json(result);
  } catch (err) {
    fail(res, err);
  }
};

// POST /api/stock/adjust { productId, warehouseId?, change (+/-), reason }
exports.adjust = inTx(async (req, t) => {
  const { productId, warehouseId, change, reason } = req.body;
  const r = await stock.adjust({ productId, warehouseId, change, reason, userId: req.user.userId }, { t });
  if (Number(change) > 0) await stock.allocateBackorders([productId], { t, userId: req.user.userId });
  return { message: "Stock adjusted", balance: r.balance };
});

// POST /api/stock/transfer { productId, fromWarehouseId, toWarehouseId, quantity, reason? }
exports.transfer = inTx(async (req, t) => {
  await stock.transfer({ ...req.body, userId: req.user.userId }, { t });
  return { message: "Stock transferred" };
});

// POST /api/stock/reallocate { productId, fromOrderId, toOrderId, quantity, reason }
// A manager moves reserved stock from one order to a more urgent one.
exports.reallocate = inTx(async (req, t) => {
  const { StockReservation, Order } = m();
  const { productId, fromOrderId, toOrderId, reason } = req.body;
  const qty = Math.trunc(Number(req.body.quantity) || 0);
  if (qty <= 0) throw new stock.StockError("Enter a quantity to move.");
  if (!reason) throw new stock.StockError("A reason is required.");
  const from = await Order.findByPk(fromOrderId, { transaction: t, lock: t.LOCK.UPDATE });
  const to = await Order.findByPk(toOrderId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!from || !to) throw new stock.StockError("Order not found", 404);
  const rows = await StockReservation.findAll({ where: { orderId: fromOrderId, productId, status: "ACTIVE", quantity: { [Op.gt]: 0 } }, transaction: t });
  let left = qty;
  for (const r of rows) {
    if (left <= 0) break;
    const take = Math.min(left, r.quantity);
    await stock.post(t, { productId, warehouseId: r.warehouseId, movement: "RELEASE", reserved: -take, ref: { type: "ORDER", id: from.id, no: from.orderNo }, userId: req.user.userId, reason: `Moved to order ${to.orderNo}: ${reason}` });
    await r.update({ quantity: r.quantity - take, status: r.quantity - take > 0 ? "ACTIVE" : "RELEASED" }, { transaction: t });
    left -= take;
  }
  if (left > 0) throw new stock.StockError(`Order ${from.orderNo} holds only ${qty - left} of this product.`);
  const result = await stock.syncOrder(to.id, { t, userId: req.user.userId });
  const { sendNotification } = require("../engagement/notification.controller");
  if (from.createdBy) {
    sendNotification({ userId: from.createdBy, title: "Stock moved to another order", message: `${qty} reserved for order ${from.orderNo} was moved to order ${to.orderNo}: ${reason}` }).catch(() => {});
  }
  return { message: `Moved ${qty} to order ${to.orderNo}`, to: result };
});

// ---------------------------------------------------------------------------
// Godowns
// ---------------------------------------------------------------------------
exports.listWarehouses = async (req, res) => {
  try {
    const { Warehouse } = m();
    res.json({ data: await Warehouse.findAll({ order: [["isDefault", "DESC"], ["name", "ASC"]] }) });
  } catch (err) {
    fail(res, err);
  }
};

exports.saveWarehouse = inTx(async (req, t) => {
  const { Warehouse } = m();
  const { code, name, address, isDefault, active } = req.body;
  if (!code || !name) throw new stock.StockError("Code and name are required.");
  let wh = req.params.id ? await Warehouse.findByPk(req.params.id, { transaction: t }) : null;
  if (req.params.id && !wh) throw new stock.StockError("Godown not found", 404);
  if (isDefault) await Warehouse.update({ isDefault: false }, { where: {}, transaction: t });
  if (wh) await wh.update({ code, name, address, isDefault: !!isDefault, active: active !== false }, { transaction: t });
  else wh = await Warehouse.create({ code, name, address, isDefault: !!isDefault, active: active !== false }, { transaction: t });
  return { data: wh };
});

// ---------------------------------------------------------------------------
// Physical stock counts
// ---------------------------------------------------------------------------
// POST /api/stock/counts { warehouseId?, productIds?, notes? } — start a count sheet
exports.createCount = inTx(async (req, t) => {
  const { StockCount, StockCountLine, StockBalance, Product } = m();
  const warehouseId = await stock.resolveWarehouseId(req.body.warehouseId, t);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const n = await StockCount.count({ where: { countNo: { [Op.like]: `CNT${stamp}%` } }, transaction: t });
  const count = await StockCount.create({ countNo: `CNT${stamp}${String(n + 1).padStart(2, "0")}`, warehouseId, notes: req.body.notes || null, createdBy: req.user.userId }, { transaction: t });
  const ids = Array.isArray(req.body.productIds) && req.body.productIds.length
    ? req.body.productIds
    : (await Product.findAll({ attributes: ["productId"], transaction: t })).map((p) => p.productId);
  const bals = await StockBalance.findAll({ where: { warehouseId, productId: ids }, transaction: t });
  const onHand = Object.fromEntries(bals.map((b) => [b.productId, b.onHand]));
  await StockCountLine.bulkCreate(ids.map((productId) => ({ countId: count.id, productId, systemQty: onHand[productId] || 0, countedQty: null })), { transaction: t });
  return { data: count, lines: ids.length };
});

exports.listCounts = async (req, res) => {
  try {
    const { StockCount } = m();
    res.json({ data: await StockCount.findAll({ order: [["createdAt", "DESC"]], limit: 100 }) });
  } catch (err) {
    fail(res, err);
  }
};

exports.getCount = async (req, res) => {
  try {
    const { StockCount, StockCountLine, Product, ProductMeta } = m();
    const count = await StockCount.findByPk(req.params.id, { include: [{ model: StockCountLine, as: "lines" }] });
    if (!count) return res.status(404).json({ message: "Count not found" });
    const [products, definitions] = await Promise.all([
      Product.findAll({ where: { productId: count.lines.map((l) => l.productId) }, attributes: ["productId", "name", "product_code", "meta"], raw: true }),
      ProductMeta.findAll({ attributes: ["id", "slug", "title"], raw: true }),
    ]);
    const pm = Object.fromEntries(products.map((p) => [p.productId, p]));
    res.json({
      data: count,
      lines: count.lines
        .map((l) => ({ ...l.toJSON(), name: pm[l.productId]?.name, product_code: pm[l.productId]?.product_code, companyCode: productCompanyCode(pm[l.productId], definitions) || null, variance: l.countedQty == null ? null : l.countedQty - l.systemQty }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    });
  } catch (err) {
    fail(res, err);
  }
};

// PUT /api/stock/counts/:id/lines { lines: [{ productId, countedQty }] }
exports.saveCountLines = inTx(async (req, t) => {
  const { StockCount, StockCountLine } = m();
  const count = await StockCount.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
  if (!count) throw new stock.StockError("Count not found", 404);
  if (count.status !== "DRAFT") throw new stock.StockError("This count is already approved.");
  for (const l of req.body.lines || []) {
    const v = l.countedQty === "" || l.countedQty == null ? null : Math.max(Math.trunc(Number(l.countedQty)), 0);
    await StockCountLine.update({ countedQty: v }, { where: { countId: count.id, productId: l.productId }, transaction: t });
  }
  return { message: "Saved" };
});

// POST /api/stock/counts/:id/approve — set on-hand to the counted figures
exports.approveCount = inTx(async (req, t) => {
  const { StockCount, StockCountLine } = m();
  const count = await StockCount.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
  if (!count) throw new stock.StockError("Count not found", 404);
  if (count.status !== "DRAFT") throw new stock.StockError("This count is already approved.");
  const lines = await StockCountLine.findAll({ where: { countId: count.id, countedQty: { [Op.ne]: null } }, transaction: t });
  let changed = 0;
  for (const l of lines) {
    const r = await stock.setOnHand(
      { productId: l.productId, warehouseId: count.warehouseId, counted: l.countedQty, reason: `Stock count ${count.countNo}`, userId: req.user.userId, ref: { id: count.id, no: count.countNo } },
      { t },
    );
    if (!r.unchanged) changed++;
  }
  await count.update({ status: "APPROVED", approvedBy: req.user.userId, approvedAt: new Date() }, { transaction: t });
  await stock.allocateBackorders(lines.map((l) => l.productId), { t, userId: req.user.userId });
  return { message: `Count approved: ${changed} product(s) changed`, changed };
});

// GET /api/stock/ledger?productId=&movement=&from=&to=&page=&limit=
exports.ledger = async (req, res) => {
  try {
    const { StockLedger } = m();
    const where = {};
    if (req.query.productId) where.productId = req.query.productId;
    if (req.query.movement) where.movement = req.query.movement;
    if (req.query.refType) where.refType = req.query.refType;
    if (req.query.refNo) where.refNo = { [Op.like]: `%${req.query.refNo}%` };
    if (req.query.search && !req.query.productId) {
      const q = `%${String(req.query.search).trim()}%`;
      const hits = await m().Product.findAll({
        where: { [Op.or]: [{ name: { [Op.like]: q } }, { product_code: { [Op.like]: q } }] },
        attributes: ["productId"],
        limit: 500,
      });
      where.productId = hits.map((h) => h.productId);
    }
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to);
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const { rows, count } = await StockLedger.findAndCountAll({ where, order: [["createdAt", "DESC"]], limit, offset: (page - 1) * limit });
    const { Product, User, Warehouse } = m();
    const pids = [...new Set(rows.map((r) => r.productId))];
    const uids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
    const [products, users, whs] = await Promise.all([
      pids.length ? Product.findAll({ where: { productId: pids }, attributes: ["productId", "name", "product_code"] }) : [],
      uids.length ? User.findAll({ where: { userId: uids }, attributes: ["userId", "name", "username"] }) : [],
      Warehouse.findAll({ attributes: ["id", "name"] }),
    ]);
    const pm = Object.fromEntries(products.map((x) => [x.productId, x]));
    const um = Object.fromEntries(users.map((u) => [u.userId, u.name || u.username]));
    const wm = Object.fromEntries(whs.map((w) => [w.id, w.name]));
    res.json({
      data: rows.map((r) => ({
        ...r.toJSON(),
        productName: pm[r.productId]?.name || null,
        productCode: pm[r.productId]?.product_code || null,
        user: um[r.userId] || null,
        warehouse: wm[r.warehouseId] || null,
      })),
      pagination: { page, limit, total: count },
    });
  } catch (err) {
    fail(res, err);
  }
};
