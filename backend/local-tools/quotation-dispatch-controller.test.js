const test = require("node:test");
const assert = require("node:assert/strict");
const clone = value => JSON.parse(JSON.stringify(value));
let activeOrder = null, lastLimits = null, synced = 0;
let events = [], stockQuantity = 20, committed = 0, rolledBack = 0, locks = 0;
const source = { quotationId: "q1", reference_number: "Q1", customerId: "customer", status: "SENT", products: [{ productId: "p1", name: "Tap", quantity: 5, price: 100 }] };
const quotation = { ...source, toJSON: () => clone(source) };
let queue = Promise.resolve();
const sequelize = { transaction(callback) {
 const result = queue.then(async () => {
  const before = clone(events), beforeStock = stockQuantity;
  try { const value = await callback({ LOCK: { UPDATE: "UPDATE" } }); committed++; return value; }
  catch (error) { events = before; stockQuantity = beforeStock; rolledBack++; throw error; }
 });
 queue = result.catch(() => {}); return result;
} };
const mock = (path, exports) => { const id = require.resolve(path); require.cache[id] = { id, filename: id, loaded: true, exports }; };
mock("../config/database", sequelize);
mock("../models", {
 Quotation: { findByPk: async (id, opts) => { if (opts?.lock === "UPDATE") locks++; return id === "q1" ? quotation : null; } },
 Order: { findAll: async opts => opts.where.status ? (activeOrder ? [activeOrder] : []) : [{ id: "linked-order" }] },
 OrderDispatch: {
  findAll: async () => events,
  count: async () => events.filter(event => !event.orderId).length,
  create: async value => { const row = clone({ ...value, id: "d" + (events.length + 1) }); events.push(row); return row; },
  findByPk: async id => events.find(row => row.id === id),
 },
});
mock("../middleware/permission", { can: async (user, module) => (user?.allowed || []).includes(module) });
mock("../modules/stock/stock.service", { dispatchOut: async (_, items, opts) => {
 lastLimits = clone(opts.reservationLimits);
 const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
 if (quantity > stockQuantity) throw Object.assign(new Error("Insufficient stock"), { status: 409 });
 stockQuantity -= quantity;
}, orderNeeds: async order => [{ needed: Math.max(0, 5 - events.flatMap(d => d.items).flatMap(item => item.orderAllocations || []).filter(a => a.orderId === order.id).reduce((sum, a) => sum + a.quantity, 0)) }], syncOrder: async () => { synced++; } });
mock("../modules/settings/settings.service", { getSetting: async () => ({}) });
mock("../modules/quotations/quotation-pdf", { enrichQuotation: async (quotation, items) => clone({ quotation, items, customer: { name: "Customer" }, productInfo: {} }) });
mock("../modules/orders/order-dispatch.controller", { transportFields: () => ({ values: {} }) });
const controller = require("../modules/orders/quotation-dispatch.controller");
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = (quantity, id = "q1") => ({ params: { id }, body: { items: [{ productId: "p1", quantity }] }, user: { userId: "user" } });
const reset = () => { activeOrder = null; lastLimits = null; synced = 0; events = []; stockQuantity = 20; committed = 0; rolledBack = 0; locks = 0; };
test("quotation dispatch commits stock and immutable shipment snapshots together", async () => {
 reset(); const res = response(); await controller.create(request(2), res);
 assert.equal(res.statusCode, 201); assert.equal(stockQuantity, 18); assert.equal(committed, 1); assert.equal(locks, 1);
 assert.equal(events[0].documentSnapshot.items[0].quantity, 2); assert.equal(events[0].quotationId, "q1");
 assert.equal(events[0].orderId, null); assert.equal(events[0].totalAmount, 200);
 source.products[0].price = 999;
 assert.equal(events[0].documentSnapshot.items[0].price, 100); source.products[0].price = 100;
});
test("concurrent shipments serialize and cannot exceed the quotation quantity", async () => {
 reset(); const a = response(), b = response();
 await Promise.all([controller.create(request(3), a), controller.create(request(3), b)]);
 assert.deepEqual([a.statusCode, b.statusCode], [201, 400]);
 assert.equal(events.length, 1); assert.equal(stockQuantity, 17); assert.equal(rolledBack, 1);
});
test("stock failure rolls back the dispatch, leaving the remaining quantity intact", async () => {
 reset(); stockQuantity = 1; const res = response(); await controller.create(request(2), res);
 assert.equal(res.statusCode, 409); assert.equal(events.length, 0); assert.equal(stockQuantity, 1);
});
test("linked order shipments count toward the quotation budget", async () => {
 reset(); events.push({ id: "old", orderId: "linked-order", items: [{ productId: "p1", quantity: 4 }] });
 const res = response(); await controller.create(request(2), res);
 assert.equal(res.statusCode, 400); assert.equal(events.length, 1);
});
test("dispatch details enforce source permissions and return the saved document", async () => {
 reset(); await controller.create(request(1), response());
 const forbidden = response(); await controller.details({ params: { dispatchId: "d1" }, user: { allowed: [] } }, forbidden);
 assert.equal(forbidden.statusCode, 403);
 const allowed = response(); await controller.details({ params: { dispatchId: "d1" }, user: { allowed: ["quotations"] } }, allowed);
 assert.equal(allowed.statusCode, 200); assert.equal(allowed.body.document.quotation.reference_number, "Q1/D1");
});

test("linked reservations are credited and order status is synchronized in the transaction", async () => {
 reset(); activeOrder = { id: "linked-order", products: [{ productId: "p1", name: "Tap", quantity: 5, price: 100 }], status: "PREPARING", update: async values => Object.assign(activeOrder, values) };
 const res = response(); await controller.create(request(2), res);
 assert.equal(res.statusCode, 201);
 assert.deepEqual(lastLimits, { p1: { "linked-order": 2 } });
 assert.equal(activeOrder.status, "PARTIALLY_DISPATCHED"); assert.equal(synced, 1);
 assert.deepEqual(events[0].items[0].orderAllocations, [{ orderId: "linked-order", quantity: 2 }]);
});
