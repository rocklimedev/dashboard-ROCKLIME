const test = require("node:test");
const assert = require("node:assert/strict");
const modelPath = require.resolve("../modules/cart/models/carts.model");
const { initialWorkspace } = require("../modules/cart/quotation-workspace");
const record = { _id: "cart-1", __v: 3, userId: "alice", items: [{ productId: "tap", quantity: 1 }], quotationWorkspace: initialWorkspace() };
let saved = 0;
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: {
  findOne: async query => { assert.deepEqual(query, { userId: "alice" }); return record; },
  findOneAndUpdate: async (filter, mutation) => {
    assert.equal(filter.__v, 3);
    assert.equal(filter["quotationWorkspace.activeId"], record.quotationWorkspace.activeId);
    assert.equal(mutation.$inc.__v, 1);
    saved++;
    return null; // Simulate another writer winning the compare-and-swap.
  },
} };
const controller = require("../modules/cart/quotation-workspace.controller");
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
test("workspace belongs to authenticated user regardless of submitted userId", async () => {
  const res = response();
  await controller.get({ user: { userId: "alice" }, body: { userId: "bob" } }, res);
  assert.equal(res.body.cart.userId, "alice");
});
test("stale revisions and racing cart writes cannot replace active products", async () => {
  const res = response();
  await controller.update({ user: { userId: "alice" }, body: { action: "new", activeId: record.quotationWorkspace.activeId, revision: -1 } }, res);
  assert.equal(res.code, 409);
  assert.equal(saved, 0);
  const racing = response();
  await controller.update({ user: { userId: "alice" }, body: { action: "new", activeId: record.quotationWorkspace.activeId, revision: 0 } }, racing);
  assert.equal(racing.code, 409);
  assert.equal(saved, 1);
  assert.deepEqual(record.items, [{ productId: "tap", quantity: 1 }]);
});
