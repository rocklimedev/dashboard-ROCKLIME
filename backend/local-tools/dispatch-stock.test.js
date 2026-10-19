const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { Op } = require("sequelize");
const { allocatedItems } = require("../modules/orders/dispatch-document");
const source = fs.readFileSync(require.resolve("../modules/stock/stock.service"), "utf8");
const fn = name => {
 const begin = source.indexOf("async function " + name + "(");
 const end = source.indexOf("\n}\n", begin) + 2;
 return source.slice(begin, end);
};
test("quotation dispatch consumes only its linked reservation credits then free stock", async () => {
 const balance = { onHand: 10, reserved: 8 };
 const reservations = [{ id: "r1", orderId: "o1", warehouseId: "w", quantity: 3 }, { id: "r2", orderId: "o2", warehouseId: "w", quantity: 2 }, { id: "other", orderId: "unrelated", warehouseId: "w", quantity: 3 }];
 for (const r of reservations) r.update = async value => Object.assign(r, value);
 const movements = [];
 const dependencies = {
  models: () => ({ StockReservation: { findAll: async opts => reservations.filter(r => opts.where.orderId[Op.in].includes(r.orderId)) } }),
  getDefaultWarehouse: async () => ({ id: "w" }), lineProductId: line => line.productId,
  post: async (_, movement) => { balance.onHand += movement.onHand || 0; balance.reserved += movement.reserved || 0; movements.push(movement); },
  availableIn: async () => balance.onHand - balance.reserved,
  StockError: Error, Op,
 };
 const dispatchOut = new Function(...Object.keys(dependencies), fn("dispatchOut") + "; return dispatchOut;")(...Object.values(dependencies));
 await dispatchOut({ id: "q", orderNo: "Q1", sourceLabel: "quotation" }, [{ productId: "p", quantity: 6 }], { t: {}, dispatchId: "d", dispatchNo: 1, reservationLimits: { p: { o1: 2, o2: 3 } } });
 assert.deepEqual(balance, { onHand: 4, reserved: 4 });
 assert.equal(reservations[2].quantity, 3); assert.equal(reservations[0].quantity, 1);
 assert.deepEqual(movements.map(m => [m.onHand, m.reserved || 0]), [[-2, -2], [-2, -2], [-2, 0]]);
 assert.equal(new Set(movements.map(m => m.key)).size, 3);
});
test("order remaining stock needs include quotation credits exactly once", async () => {
 const dependencies = { models: () => ({ OrderDispatch: { findAll: async opts => opts.where.orderId === "o1" ? [{ items: [{ productId: "p", quantity: 1 }], status: "DISPATCHED" }] : [{ items: [{ productId: "p", price: 100, quantity: 3, orderAllocations: [{ orderId: "o1", quantity: 2 }, { orderId: "o2", quantity: 1 }] }], status: "DISPATCHED" }] } }),
 asList: value => Array.isArray(value) ? value : [], lineProductId: line => line.productId,
 require: () => ({ allocatedItems }),
 };
 const needs = new Function(...Object.keys(dependencies), fn("orderNeeds") + "; return orderNeeds;")(...Object.values(dependencies));
 assert.deepEqual(await needs({ id: "o1", quotationId: "q", products: [{ productId: "p", quantity: 5 }] }), [{ productId: "p", ordered: 5, dispatched: 3, needed: 2 }]);
});
