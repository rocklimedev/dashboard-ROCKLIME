const test = require("node:test");
const assert = require("node:assert/strict");
const { parseItems, makeReference, loadReferences } = require("../modules/products/productReferences");

test("handles legacy JSON and preserves all matching product lines and locations", () => {
  const lines = [{ productId: "p", qty: 2, sellingPrice: 0, locations: [{ floorName: "First", roomName: "Bedroom", assignedQuantity: 2 }] },
    { productId: "other", quantity: 100 }, { productId: "p", quantity: 3, unitPrice: 12 }];
  const reference = makeReference("quotation", { quotationId: "q", reference_number: "Q-1", customer: { name: "Client" } }, JSON.stringify(JSON.stringify(lines)), "p");
  assert.equal(reference.quantity, 5);
  assert.equal(reference.lines.length, 2);
  assert.equal(reference.lines[0].price, 0);
  assert.equal(reference.lines[0].locations[0].roomName, "Bedroom");
  assert.equal(reference.href, "/quotation/q");
  assert.deepEqual(parseItems("bad JSON"), []);
  assert.equal(makeReference("order", { id: "o" }, lines, "absent"), null);
});

test("combines SQL snapshots and Mongo references without stale or orphan documents", async () => {
  const model = (docs) => ({ findAll: async () => docs.map((doc) => ({ toJSON: () => doc })) });
  const items = (docs) => ({ find: () => ({ lean: async () => docs }) });
  const dependencies = {
    sequelize: { fn: (...args) => args, col: (v) => v, where: (...args) => args },
    Customer: {}, Vendor: {},
    Quotation: model([{ quotationId: "q", products: [{ productId: "p", quantity: 2 }], quotation_date: "2026-01-01" }]),
    Order: model([{ id: "stale", products: [{ productId: "other", quantity: 2 }] },
      { id: "legacy", products: null, createdAt: "2026-02-01" }]),
    PurchaseOrder: model([{ id: "po", poNumber: "PO-1", vendor: { vendorName: "Vendor" }, orderDate: "2026-03-01" }]),
    FieldGuidedSheet: model([{ id: "fgs", fgsNumber: "FGS-1", orderDate: "2026-04-01" }]),
    QuotationItem: items([{ quotationId: "q", items: [{ productId: "p", quantity: 2 }] }]),
    OrderItem: items([{ orderId: "stale", items: [{ productId: "p", quantity: 9 }] },
      { orderId: "legacy", items: [{ productId: "p", quantity: 1 }] },
      { orderId: "deleted", items: [{ productId: "p", quantity: 3 }] }]),
    PoItem: items([{ poId: "po", items: [{ productId: "p", quantity: 4, unitPrice: 25 }] }]),
    FgsItem: items([{ fgsId: "fgs", items: [{ productId: "p", quantity: 6 }] }]),
  };
  const references = await loadReferences(dependencies, "p");
  assert.deepEqual(references.map((r) => r.key), ["fgs:fgs", "po:po", "order:legacy", "quotation:q"]);
  assert.equal(references.find((r) => r.type === "po").party, "Vendor");
  assert.equal(references.find((r) => r.type === "po").lines[0].price, 25);
});
