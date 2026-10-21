import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcileQuotationItems } from "./quotationCartHelpers.js";
test("reload keeps draft room assignments and options while incorporating current cart quantities and added products", () => {
  const local = [{ productId: "tap", quantity: 1, price: 100, locations: [{ roomId: "bath" }], isOptionFor: "main", priority: 4 }];
  const result = reconcileQuotationItems([{ productId: "tap", quantity: 3, price: 120 }, { productId: "sink", quantity: 2 }], local);
  assert.equal(result[0].quantity, 3);
  assert.equal(result[0].price, 120);
  assert.equal(result[0].isOptionFor, "main");
  assert.deepEqual(result[0].locations, local[0].locations);
  assert.equal(result[1].productId, "sink");
  assert.equal(reconcileQuotationItems([], local).length, 0);
  assert.equal(local[0].quantity, 1);
});
