import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import { shareKey, reorderShares, nextSectionPriority } from "./shareHelpers.js";

const fixtures = () => [
  { productId: "a", qty: 4, priority: 0, locations: [
    { floorId: null, roomId: null, assignedQuantity: 2, priority: 0 },
    { shareId: "split-1", floorId: null, roomId: null, assignedQuantity: 1, priority: 2 },
    { shareId: "split-2", floorId: "f", roomId: "r", assignedQuantity: 1, priority: 7 },
  ] },
  { productId: "b", qty: 1, priority: 1 },
];
const orderedRows = [
  { productId: "a", _locationKey: "split-1" },
  { productId: "b", _locationKey: "::" },
  { productId: "a", _locationKey: "::" },
];

test("split shares in the same section have distinct drag identities and reorder independently", () => {
  const products = fixtures();
  assert.notEqual(shareKey(products[0].locations[0]), shareKey(products[0].locations[1]));
  const updated = reorderShares(products, orderedRows);
  assert.deepEqual(updated[0].locations.map((l) => l.priority), [2, 0, 7]);
  assert.equal(updated[1].locations[0].priority, 1);
  assert.equal(updated[0].qty, 4);
  assert.deepEqual(products[0].locations.map((l) => l.priority), [0, 2, 7]);
});

test("new shares append after all products in the destination section", () => {
  const products = fixtures();
  products.push({ productId: "c", priority: 15, qty: 1 });
  assert.equal(nextSectionPriority(products, null, null), 16);
  assert.equal(nextSectionPriority(products, "f", "r"), 8);
  assert.equal(nextSectionPriority(products, "other", "room"), 0);
});

test("save normalization and reload preserve split identities and per-section order", () => {
  const backend = readFileSync(new URL("../../../../backend/modules/quotations/quotation.controller.js", import.meta.url), "utf8");
  const server = vm.runInNewContext(`${backend.slice(backend.indexOf("const num ="), backend.indexOf("// Safe meta value extractor"))}; ({ normalizeLocations, rankPerSection })`);
  const frontend = readFileSync(new URL("../../concepts/Quotation/AddQuntation.jsx", import.meta.url), "utf8");
  const normalizeLoaded = vm.runInNewContext(`${frontend.slice(frontend.indexOf("const normalizeLoadedProducts ="), frontend.indexOf("const AddQuotation ="))}; normalizeLoadedProducts`);
  const ordered = reorderShares(fixtures(), orderedRows);
  const saved = server.rankPerSection(ordered.map((p) => ({ ...p,
    locations: server.normalizeLocations(p, p.qty, []),
  })));
  const reloaded = normalizeLoaded(JSON.parse(JSON.stringify(saved)));
  assert.equal(reloaded[0].locations.length, 3);
  assert.equal(reloaded[0].locations[1].shareId, "split-1");
  assert.deepEqual(Array.from(reloaded[0].locations, (l) => l.priority), [2, 0, 0]);
  assert.equal(reloaded[0].qty, 4);
  const again = reorderShares(reloaded, [...orderedRows].reverse());
  assert.deepEqual(Array.from(again[0].locations, (l) => l.priority), [0, 2, 0]);
});
