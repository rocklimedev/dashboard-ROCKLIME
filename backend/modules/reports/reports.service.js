// Reports that run on the server and come back as a table the screen can
// preview, chart and export. Every report returns
//   { title, description, columns: [{ key, title, type }], rows, summary }
// column types: text, number, money, percent, date, link (with linkKey).
const { QueryTypes } = require("sequelize");
const { r2 } = require("../../lib/quotationMath");

const m = () => require("../../models");
const SELLING_PRICE = "9ba862ef-f993-4873-95ef-1fef10036aa5";
const COUNTED = "('DRAFT','CANCELED')";
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
const lineValue = (l) => {
  const qty = Number(l.quantity) || 0;
  const price = Number(l.price) || 0;
  const d = Number(l.discount) || 0;
  const unit = (l.discountType || "percent") === "percent" ? price * (1 - d / 100) : price - d;
  return { qty, value: r2(Math.max(unit, 0) * qty) };
};
const q = (sql, replacements = {}) => m().sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

async function ordersInRange(from, to) {
  return q(
    `SELECT o.id, o.orderNo, o.createdAt, o.status, o.finalAmount, o.products, o.createdFor, o.createdBy, o.assignedUserId,
            c.name AS customerName
     FROM orders o LEFT JOIN customers c ON c.customerId = o.createdFor
     WHERE o.status NOT IN ${COUNTED} AND o.createdAt BETWEEN :from AND :to`,
    { from: `${from} 00:00:00`, to: `${to} 23:59:59` },
  );
}

const userNames = async (ids) => {
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return {};
  const rows = await q("SELECT userId, name, username FROM users WHERE userId IN (:list)", { list });
  return Object.fromEntries(rows.map((u) => [u.userId, u.name || u.username]));
};

const REPORTS = {
  "sales-by-period": {
    title: "Sales by period",
    description: "Confirmed orders and quotations per day, week or month, with conversion.",
    module: "orders",
    async run({ from, to, group = "month" }) {
      const fmt = group === "day" ? "%Y-%m-%d" : group === "week" ? "%x-W%v" : "%Y-%m";
      const orders = await q(
        `SELECT DATE_FORMAT(createdAt, :fmt) AS period, COUNT(*) AS orders, COALESCE(SUM(finalAmount),0) AS orderValue
         FROM orders WHERE status NOT IN ${COUNTED} AND createdAt BETWEEN :from AND :to GROUP BY period`,
        { fmt, from: `${from} 00:00:00`, to: `${to} 23:59:59` },
      );
      const quotes = await q(
        `SELECT DATE_FORMAT(createdAt, :fmt) AS period, COUNT(*) AS quotations, COALESCE(SUM(finalAmount),0) AS quotationValue,
                SUM(status = 'WON') AS won
         FROM quotations WHERE createdAt BETWEEN :from AND :to GROUP BY period`,
        { fmt, from: `${from} 00:00:00`, to: `${to} 23:59:59` },
      );
      const keys = [...new Set([...orders.map((o) => o.period), ...quotes.map((x) => x.period)])].sort();
      const rows = keys.map((k) => {
        const o = orders.find((x) => x.period === k) || {};
        const qt = quotes.find((x) => x.period === k) || {};
        return {
          period: k,
          orders: Number(o.orders || 0),
          orderValue: Number(o.orderValue || 0),
          quotations: Number(qt.quotations || 0),
          quotationValue: Number(qt.quotationValue || 0),
          conversion: Number(qt.quotations) ? r2((Number(qt.won || 0) / Number(qt.quotations)) * 100) : null,
        };
      });
      const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
      return {
        chart: { x: "period", y: ["orderValue", "quotationValue"] },
        columns: [
          { key: "period", title: group === "day" ? "Day" : group === "week" ? "Week" : "Month", type: "text" },
          { key: "orders", title: "Orders", type: "number" },
          { key: "orderValue", title: "Order value", type: "money" },
          { key: "quotations", title: "Quotations", type: "number" },
          { key: "quotationValue", title: "Quotation value", type: "money" },
          { key: "conversion", title: "Won %", type: "percent" },
        ],
        rows,
        summary: { orders: sum("orders"), orderValue: sum("orderValue"), quotations: sum("quotations"), quotationValue: sum("quotationValue") },
      };
    },
  },

  "sales-by-brand": {
    title: "Sales by brand",
    description: "Pieces and value sold per brand, from confirmed order lines.",
    module: "orders",
    async run({ from, to }) {
      const orders = await ordersInRange(from, to);
      const lines = orders.flatMap((o) => asList(o.products).map((l) => ({ ...l, orderId: o.id })));
      const ids = [...new Set(lines.map((l) => l.productId || l.id).filter(Boolean))];
      const prods = ids.length
        ? await q(`SELECT p.productId, b.brandName FROM products p LEFT JOIN brands b ON b.id = p.brandId WHERE p.productId IN (:ids)`, { ids })
        : [];
      const brandOf = Object.fromEntries(prods.map((p) => [p.productId, p.brandName || "No brand"]));
      const by = {};
      for (const l of lines) {
        const b = brandOf[l.productId || l.id] || "No brand";
        const { qty, value } = lineValue(l);
        by[b] ||= { brand: b, pieces: 0, value: 0, orders: new Set() };
        by[b].pieces += qty;
        by[b].value = r2(by[b].value + value);
        by[b].orders.add(l.orderId);
      }
      const total = Object.values(by).reduce((a, r) => a + r.value, 0);
      const rows = Object.values(by)
        .map((r) => ({ brand: r.brand, orders: r.orders.size, pieces: r.pieces, value: r.value, share: total ? r2((r.value / total) * 100) : 0 }))
        .sort((a, b) => b.value - a.value);
      return {
        chart: { x: "brand", y: ["value"] },
        columns: [
          { key: "brand", title: "Brand", type: "text" },
          { key: "orders", title: "Orders", type: "number" },
          { key: "pieces", title: "Pieces", type: "number" },
          { key: "value", title: "Value (before GST)", type: "money" },
          { key: "share", title: "Share", type: "percent" },
        ],
        rows,
        summary: { value: r2(total), pieces: rows.reduce((a, r) => a + r.pieces, 0) },
      };
    },
  },

  "sales-by-salesperson": {
    title: "Salesperson performance",
    description: "Quotations made, won and lost, win rate and order value per person.",
    module: "orders",
    async run({ from, to }) {
      const range = { from: `${from} 00:00:00`, to: `${to} 23:59:59` };
      const quotes = await q(
        `SELECT createdBy AS userId, COUNT(*) AS quotations, COALESCE(SUM(finalAmount),0) AS quoted,
                SUM(status='WON') AS won, SUM(status='LOST') AS lost, SUM(status='EXPIRED') AS expired,
                SUM(status IN ('DRAFT','SENT','NEGOTIATION')) AS open
         FROM quotations WHERE createdAt BETWEEN :from AND :to GROUP BY createdBy`,
        range,
      );
      const orders = await q(
        `SELECT COALESCE(assignedUserId, createdBy) AS userId, COUNT(*) AS orders, COALESCE(SUM(finalAmount),0) AS orderValue
         FROM orders WHERE status NOT IN ${COUNTED} AND createdAt BETWEEN :from AND :to GROUP BY COALESCE(assignedUserId, createdBy)`,
        range,
      );
      const names = await userNames([...quotes.map((x) => x.userId), ...orders.map((x) => x.userId)]);
      const ids = [...new Set([...quotes.map((x) => x.userId), ...orders.map((x) => x.userId)])];
      const rows = ids
        .map((id) => {
          const a = quotes.find((x) => x.userId === id) || {};
          const b = orders.find((x) => x.userId === id) || {};
          const closed = Number(a.won || 0) + Number(a.lost || 0) + Number(a.expired || 0);
          return {
            person: names[id] || "Unknown",
            quotations: Number(a.quotations || 0),
            quoted: Number(a.quoted || 0),
            open: Number(a.open || 0),
            won: Number(a.won || 0),
            lost: Number(a.lost || 0),
            winRate: closed ? r2((Number(a.won || 0) / closed) * 100) : null,
            orders: Number(b.orders || 0),
            orderValue: Number(b.orderValue || 0),
          };
        })
        .sort((x, y) => y.orderValue - x.orderValue);
      return {
        chart: { x: "person", y: ["orderValue"] },
        columns: [
          { key: "person", title: "Salesperson", type: "text" },
          { key: "quotations", title: "Quotations", type: "number" },
          { key: "quoted", title: "Quoted value", type: "money" },
          { key: "open", title: "Open", type: "number" },
          { key: "won", title: "Won", type: "number" },
          { key: "lost", title: "Lost", type: "number" },
          { key: "winRate", title: "Win rate", type: "percent" },
          { key: "orders", title: "Orders", type: "number" },
          { key: "orderValue", title: "Order value", type: "money" },
        ],
        rows,
      };
    },
  },

  "top-products": {
    title: "Top products",
    description: "Best sellers by value in the period, with pieces sold.",
    module: "orders",
    async run({ from, to }) {
      const orders = await ordersInRange(from, to);
      const by = {};
      for (const o of orders)
        for (const l of asList(o.products)) {
          const id = l.productId || l.id;
          if (!id) continue;
          const { qty, value } = lineValue(l);
          by[id] ||= { productId: id, name: l.name, pieces: 0, value: 0, orders: 0 };
          by[id].pieces += qty;
          by[id].value = r2(by[id].value + value);
          by[id].orders += 1;
        }
      const ids = Object.keys(by);
      const prods = ids.length ? await q("SELECT productId, name, product_code FROM products WHERE productId IN (:ids)", { ids }) : [];
      for (const p of prods) Object.assign(by[p.productId], { name: p.name, code: p.product_code });
      const rows = Object.values(by).sort((a, b) => b.value - a.value).slice(0, 100);
      return {
        chart: { x: "name", y: ["value"], limit: 15 },
        columns: [
          { key: "name", title: "Product", type: "link", linkKey: "productId", linkTo: "/product/" },
          { key: "code", title: "Code", type: "text" },
          { key: "orders", title: "Orders", type: "number" },
          { key: "pieces", title: "Pieces", type: "number" },
          { key: "value", title: "Value (before GST)", type: "money" },
        ],
        rows,
      };
    },
  },

  "top-customers": {
    title: "Top customers",
    description: "Customers by order value in the period, with what they still owe.",
    module: "orders",
    async run({ from, to }) {
      const rows = await q(
        `SELECT o.createdFor AS customerId, c.name AS customer, c.customerType AS type, COUNT(*) AS orders,
                COALESCE(SUM(o.finalAmount),0) AS value, MAX(o.createdAt) AS lastOrder
         FROM orders o LEFT JOIN customers c ON c.customerId = o.createdFor
         WHERE o.status NOT IN ${COUNTED} AND o.createdAt BETWEEN :from AND :to
         GROUP BY o.createdFor, c.name, c.customerType ORDER BY value DESC LIMIT 200`,
        { from: `${from} 00:00:00`, to: `${to} 23:59:59` },
      );
      const balances = await require("../payments/payment.controller").orderBalances();
      const due = {};
      for (const b of balances) due[b.customerId] = r2((due[b.customerId] || 0) + Math.max(b.due, 0));
      return {
        chart: { x: "customer", y: ["value"], limit: 15 },
        columns: [
          { key: "customer", title: "Customer", type: "link", linkKey: "customerId", linkTo: "/customer/" },
          { key: "type", title: "Type", type: "text" },
          { key: "orders", title: "Orders", type: "number" },
          { key: "value", title: "Order value", type: "money" },
          { key: "due", title: "Owes now", type: "money" },
          { key: "lastOrder", title: "Last order", type: "date" },
        ],
        rows: rows.map((r) => ({ ...r, orders: Number(r.orders), value: Number(r.value), due: due[r.customerId] || 0 })),
      };
    },
  },

  "lost-reasons": {
    title: "Why quotations are lost",
    description: "Lost quotations in the period by reason, with their value.",
    module: "quotations",
    async run({ from, to }) {
      const rows = await q(
        `SELECT COALESCE(lostReason,'No reason given') AS reason, COUNT(*) AS quotations, COALESCE(SUM(finalAmount),0) AS value
         FROM quotations WHERE status = 'LOST' AND COALESCE(statusChangedAt, updatedAt) BETWEEN :from AND :to
         GROUP BY reason ORDER BY value DESC`,
        { from: `${from} 00:00:00`, to: `${to} 23:59:59` },
      );
      return {
        chart: { x: "reason", y: ["value"] },
        columns: [
          { key: "reason", title: "Reason", type: "text" },
          { key: "quotations", title: "Quotations", type: "number" },
          { key: "value", title: "Value lost", type: "money" },
        ],
        rows: rows.map((r) => ({ ...r, quotations: Number(r.quotations), value: Number(r.value) })),
      };
    },
  },

  referrals: {
    title: "Architect & contractor referrals",
    description: "Business brought by each architect, interior designer or contractor (customers they referred).",
    module: "customers",
    async run({ from, to }) {
      const rows = await q(
        `SELECT r.customerId, r.name AS referrer, r.customerType AS type, r.mobileNumber AS phone,
                COUNT(DISTINCT c.customerId) AS customers,
                COUNT(o.id) AS orders,
                COALESCE(SUM(o.finalAmount),0) AS value
         FROM customers r
         JOIN customers c ON c.referredBy = r.customerId
         LEFT JOIN orders o ON o.createdFor = c.customerId AND o.status NOT IN ${COUNTED} AND o.createdAt BETWEEN :from AND :to
         GROUP BY r.customerId, r.name, r.customerType, r.mobileNumber
         ORDER BY value DESC`,
        { from: `${from} 00:00:00`, to: `${to} 23:59:59` },
      );
      return {
        chart: { x: "referrer", y: ["value"], limit: 15 },
        columns: [
          { key: "referrer", title: "Referred by", type: "link", linkKey: "customerId", linkTo: "/customer/" },
          { key: "type", title: "Type", type: "text" },
          { key: "phone", title: "Phone", type: "text" },
          { key: "customers", title: "Customers referred", type: "number" },
          { key: "orders", title: "Orders in period", type: "number" },
          { key: "value", title: "Order value", type: "money" },
        ],
        rows: rows.map((r) => ({ ...r, customers: Number(r.customers), orders: Number(r.orders), value: Number(r.value) })),
        summary: { value: rows.reduce((a, r) => a + Number(r.value), 0) },
      };
    },
  },

  "stock-value": {
    title: "Stock value",
    description: "What is in the godowns, valued at the selling price, by brand.",
    module: "inventory",
    async run() {
      const rows = await q(
        `SELECT p.productId, p.name, p.product_code AS code, b.brandName AS brand,
                SUM(COALESCE(sb.onHand,0)) AS onHand, SUM(COALESCE(sb.reserved,0)) AS reserved, SUM(COALESCE(sb.damaged,0)) AS damaged,
                p.meta
         FROM products p
         LEFT JOIN stock_balances sb ON sb.productId = p.productId
         LEFT JOIN brands b ON b.id = p.brandId
         GROUP BY p.productId, p.name, p.product_code, b.brandName, p.meta
         HAVING onHand > 0
         ORDER BY b.brandName, p.name`,
      );
      const price = (meta) => {
        let x = meta;
        for (let i = 0; i < 3 && typeof x === "string"; i++) {
          try {
            x = JSON.parse(x);
          } catch {
            x = {};
          }
        }
        return Number(x?.[SELLING_PRICE]) || 0;
      };
      const out = rows.map((r) => {
        const p = price(r.meta);
        return {
          productId: r.productId,
          name: r.name,
          code: r.code,
          brand: r.brand || "No brand",
          onHand: Number(r.onHand),
          reserved: Number(r.reserved),
          available: Number(r.onHand) - Number(r.reserved),
          price: p,
          value: r2(Number(r.onHand) * p),
        };
      });
      const total = r2(out.reduce((a, r) => a + r.value, 0));
      const missing = out.filter((r) => !r.price).length;
      return {
        columns: [
          { key: "name", title: "Product", type: "link", linkKey: "productId", linkTo: "/product/" },
          { key: "code", title: "Code", type: "text" },
          { key: "brand", title: "Brand", type: "text" },
          { key: "onHand", title: "On hand", type: "number" },
          { key: "reserved", title: "Reserved", type: "number" },
          { key: "available", title: "Available", type: "number" },
          { key: "price", title: "Selling price", type: "money" },
          { key: "value", title: "Value", type: "money" },
        ],
        rows: out.sort((a, b) => b.value - a.value),
        summary: { value: total, products: out.length, missingPrice: missing },
      };
    },
  },

  "dead-stock": {
    title: "Slow and dead stock",
    description: "Products in stock that have not been ordered for a number of days.",
    module: "inventory",
    params: ["days"],
    async run({ days = 90 }) {
      const d = Math.min(Math.max(parseInt(days, 10) || 90, 15), 730);
      const since = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
      const recent = await q(`SELECT products FROM orders WHERE status NOT IN ${COUNTED} AND createdAt >= :since`, { since });
      const sold = new Set();
      for (const o of recent) for (const l of asList(o.products)) sold.add(l.productId || l.id);
      const last = await q(`SELECT products, createdAt FROM orders WHERE status NOT IN ${COUNTED} ORDER BY createdAt DESC LIMIT 5000`);
      const lastSale = {};
      for (const o of last) for (const l of asList(o.products)) {
        const id = l.productId || l.id;
        if (id && !lastSale[id]) lastSale[id] = o.createdAt;
      }
      const stockRows = await q(
        `SELECT p.productId, p.name, p.product_code AS code, b.brandName AS brand, SUM(COALESCE(sb.onHand,0)) AS onHand, MIN(p.createdAt) AS added
         FROM products p LEFT JOIN stock_balances sb ON sb.productId = p.productId LEFT JOIN brands b ON b.id = p.brandId
         GROUP BY p.productId, p.name, p.product_code, b.brandName HAVING onHand > 0`,
      );
      const rows = stockRows
        .filter((r) => !sold.has(r.productId))
        .map((r) => ({
          productId: r.productId,
          name: r.name,
          code: r.code,
          brand: r.brand || "No brand",
          onHand: Number(r.onHand),
          lastSale: lastSale[r.productId] || null,
          daysIdle: Math.floor((Date.now() - new Date(lastSale[r.productId] || r.added).getTime()) / 864e5),
        }))
        .sort((a, b) => b.daysIdle - a.daysIdle);
      return {
        columns: [
          { key: "name", title: "Product", type: "link", linkKey: "productId", linkTo: "/product/" },
          { key: "code", title: "Code", type: "text" },
          { key: "brand", title: "Brand", type: "text" },
          { key: "onHand", title: "On hand", type: "number" },
          { key: "lastSale", title: "Last ordered", type: "date" },
          { key: "daysIdle", title: "Days without an order", type: "number" },
        ],
        rows,
        summary: { products: rows.length, days: d },
      };
    },
  },

  "reservation-age": {
    title: "Reserved stock by age",
    description: "Stock held for orders that have not been dispatched, oldest first.",
    module: "inventory",
    async run() {
      const rows = await q(
        `SELECT r.orderId, r.orderNo, r.productId, p.name AS product, SUM(r.quantity) AS qty, MIN(r.createdAt) AS since,
                o.status, c.name AS customer
         FROM stock_reservations r
         JOIN orders o ON o.id = r.orderId
         LEFT JOIN customers c ON c.customerId = o.createdFor
         LEFT JOIN products p ON p.productId = r.productId
         WHERE r.status = 'ACTIVE'
         GROUP BY r.orderId, r.orderNo, r.productId, p.name, o.status, c.name
         ORDER BY since ASC`,
      );
      return {
        columns: [
          { key: "orderNo", title: "Order", type: "link", linkKey: "orderId", linkTo: "/order/" },
          { key: "customer", title: "Customer", type: "text" },
          { key: "product", title: "Product", type: "text" },
          { key: "qty", title: "Reserved", type: "number" },
          { key: "status", title: "Order status", type: "text" },
          { key: "since", title: "Reserved since", type: "date" },
          { key: "days", title: "Days", type: "number" },
        ],
        rows: rows.map((r) => ({ ...r, qty: Number(r.qty), days: Math.floor((Date.now() - new Date(r.since).getTime()) / 864e5) })),
      };
    },
  },
};

function catalogue(canFn) {
  return Object.entries(REPORTS).map(([key, r]) => ({ key, title: r.title, description: r.description, module: r.module, params: r.params || [] }));
}

async function runReport(key, params) {
  const r = REPORTS[key];
  if (!r) throw Object.assign(new Error("Unknown report"), { status: 404 });
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from || "") ? params.from : today.slice(0, 8) + "01";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to || "") ? params.to : today;
  if (from > to) throw Object.assign(new Error("The start date is after the end date."), { status: 400 });
  const data = await r.run({ ...params, from, to });
  return { key, title: r.title, description: r.description, from, to, ...data };
}

module.exports = { REPORTS, catalogue, runReport };
