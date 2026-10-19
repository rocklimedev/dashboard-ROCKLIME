const test = require("node:test");
const assert = require("node:assert/strict");
const { remainingLines, selectDispatchItems, batchQuotation, allocateOrders, allocatedItems } = require("../modules/orders/dispatch-document");
const { quotationTotals } = require("../lib/quotationMath");
const products = [
 { productId: "tap", groupId: "g1", name: "Tap", quantity: 5, price: 100, discount: 10, discountType: "percent", additionalDiscount: 2,
   locations: [{ floorName: "First", roomName: "Bath", assignedQuantity: 2 }, { floorName: "Second", roomName: "Bath", assignedQuantity: 3 }] },
 { productId: "sink", name: "Sink", quantity: 3, price: 200, flatPrice: 180 },
 { productId: "upgrade", name: "Alternative", quantity: 5, price: 999, isOptionFor: "tap" },
];
test("remaining quantities count both direct and linked-order batches", () => {
 const initial = remainingLines(products, []);
 const lines = remainingLines(products, [{ items: [{ sourceLineKey: initial[0].sourceLineKey, productId: "tap", quantity: 2 }] }, { items: [{ productId: "tap", quantity: 1 }] }]);
 assert.equal(lines.length, 2);
 assert.equal(lines[0].dispatched, 3);
 assert.equal(lines[0].remaining, 2);
 assert.equal(lines[1].remaining, 3);
});
test("selected batches preserve actual quantities, pricing and only allocated room shares", () => {
 const lines = remainingLines(products, [{ items: [{ productId: "tap", quantity: 1 }] }]);
 const selected = selectDispatchItems(lines, [{ productId: "tap", quantity: 2 }, { productId: "sink", quantity: 1 }]);
 assert.equal(selected[0].total, 176);
 assert.deepEqual(selected[0].locations.map(loc => loc.assignedQuantity), [1, 1]);
 assert.equal(selected[1].total, 180);
 assert.deepEqual(products[0].locations.map(loc => loc.assignedQuantity), [2, 3]);
 assert.deepEqual(remainingLines(products, [{ items: selected }]).map(p => p.remaining), [3, 2]);
});
test("duplicate request entries are merged before remaining checks", () => {
 const lines = remainingLines(products, []);
 assert.throws(() => selectDispatchItems(lines, [{ productId: "tap", quantity: 3 }, { productId: "tap", quantity: 3 }]), /Only 5 remaining/);
 assert.equal(selectDispatchItems(lines, [{ productId: "tap", quantity: 2 }, { productId: "tap", quantity: 1 }])[0].quantity, 3);
});
test("invalid, unknown and alternative quantities are rejected", () => {
 const lines = remainingLines(products, []);
 for (const quantity of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => selectDispatchItems(lines, [{ productId: "tap", quantity }]));
 for (const productId of ["unknown", "upgrade"]) assert.throws(() => selectDispatchItems(lines, [{ productId, quantity: 1 }]));
 assert.throws(() => selectDispatchItems(lines, []));
});
test("reordered or regrouped quotation lines cannot reset already-dispatched quantities", () => {
 const key = remainingLines(products, [])[0].sourceLineKey;
 const lines = remainingLines([{ ...products[0], groupId: "changed" }], [{ items: [{ productId: "tap", sourceLineKey: key, quantity: 4 }] }]);
 assert.equal(lines[0].remaining, 1);
});
test("fixed quotation amounts are apportioned; percentage and GST rates stay unchanged", () => {
 const all = [{ productId: "p", quantity: 4, price: 100 }];
 const selected = selectDispatchItems(remainingLines(all, []), [{ productId: "p", quantity: 1 }]);
 const q = batchQuotation({ flatPrice: 360, shippingAmount: 40, additionalDiscount: 20, extraDiscount: 10, extraDiscountType: "percent", gst: 18,
  miscellaneousChargeItems: [{ name: "Packing", amount: 80 }] }, all, selected, "Q1/D1", "2026-10-19");
 assert.equal(q.flatPrice, 90); assert.equal(q.shippingAmount, 10); assert.equal(q.additionalDiscount, 5);
 assert.deepEqual(q.miscellaneousChargeItems, [{ name: "Packing", amount: 20 }]);
 assert.equal(q.extraDiscount, 10); assert.equal(q.gst, 18);
 assert.equal(quotationTotals({ ...q, items: selected, shipping: q.shippingAmount, gstRate: q.gst }).taxableValue, 103);
});

test("quotation batches allocate remaining quantities across linked orders once", () => {
 const orders = [{ id: "o1", products: [{ productId: "tap", quantity: 4, price: 100 }] }, { id: "o2", products: [{ productId: "tap", quantity: 3, price: 100 }] }];
 const prior = [{ orderId: "o1", items: [{ productId: "tap", quantity: 1 }] }, { orderId: null, items: [{ productId: "tap", quantity: 1, orderAllocations: [{ orderId: "o1", quantity: 1 }] }] }];
 const items = allocateOrders([{ productId: "tap", quantity: 4, price: 100 }], orders, prior);
 assert.deepEqual(items[0].orderAllocations, [{ orderId: "o1", quantity: 2 }, { orderId: "o2", quantity: 2 }]);
 assert.equal(allocatedItems({ items }, "o1")[0].quantity, 2);
 assert.equal(allocatedItems({ items }, "o2")[0].total, 200);
 assert.deepEqual(allocatedItems({ items }, "unrelated"), []);
});
