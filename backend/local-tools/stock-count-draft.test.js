const test = require("node:test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const moduleUrl = pathToFileURL(path.resolve(__dirname, "../../frontend-v2/src/utils/stockCountDraft.js")).href;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const lines = [{ productId: "a", countedQty: null }, { productId: "b", countedQty: 3 }];
async function fixture({ save = async () => {}, delay = 60000, store = new Map(), key = "user:count" } = {}) {
 const { createStockCountDraft } = await import(moduleUrl);
 let state;
 const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
 const draft = createStockCountDraft({ key, storage, save, delay, onChange: value => { state = value; } });
 draft.restore(lines);
 return { draft, store, state: () => state };
}
test("quantity changes debounce into a draft save, including a zero count", async () => {
 const requests = [];
 const f = await fixture({ save: async rows => { requests.push(rows); }, delay: 15 });
 try {
  f.draft.edit("a", 2); f.draft.edit("a", 4); f.draft.edit("b", 0);
  assert.deepEqual(JSON.parse(f.store.get("user:count")).edits, { a: 4, b: 0 });
  await pause(40);
  assert.deepEqual(requests, [[{ productId: "a", countedQty: 4 }, { productId: "b", countedQty: 0 }]]);
  assert.equal(f.store.has("user:count"), false); assert.equal(f.state().status, "Draft saved");
  assert.equal(f.state().edits.a, 4);
  f.draft.receive([{ productId: "a", countedQty: 4 }, { productId: "b", countedQty: 0 }], true);
  assert.deepEqual(f.state().edits, {});
 } finally { f.draft.dispose(); }
});
test("restoration keeps unsaved rows and ignores stale, invalid and already-saved entries", async () => {
 const store = new Map([["user:count", JSON.stringify({ edits: { a: 0, b: 3, removed: 9, invalid: -1 } })], ["other:count", "keep"]]);
 const f = await fixture({ store });
 try {
  assert.deepEqual(f.state().edits, { a: 0 }); assert.match(f.state().status, /restored/);
  assert.equal(store.get("other:count"), "keep");
 } finally { f.draft.dispose(); }
});
test("edits made during a save are saved afterward and never cleared by the older response", async () => {
 const requests = []; let release;
 const first = new Promise(resolve => { release = resolve; });
 const f = await fixture({ save: async rows => { requests.push(rows); if (requests.length === 1) await first; } });
 try {
  f.draft.edit("a", 1); const saving = f.draft.flush(); await Promise.resolve();
  f.draft.edit("a", 2); f.draft.edit("b", null);
  release(); assert.equal(await saving, true);
  assert.deepEqual(requests, [[{ productId: "a", countedQty: 1 }], [{ productId: "a", countedQty: 2 }, { productId: "b", countedQty: null }]]);
  assert.equal(f.state().edits.a, 2); assert.equal(f.state().edits.b, null); assert.equal(f.state().pendingCount, 0);
 } finally { f.draft.dispose(); }
});
test("failed server saves remain recoverable after leaving the workspace", async () => {
 const store = new Map(); const f = await fixture({ store, save: async () => { throw new Error("offline"); } });
 f.draft.edit("a", 8); assert.equal(await f.draft.flush(), false); assert.equal(f.state().pendingCount, 1);
 assert.match(f.state().status, /kept in this browser/); f.draft.dispose();
 const requests = []; const restored = await fixture({ store, save: async rows => requests.push(rows) });
 try {
  assert.equal(restored.state().edits.a, 8); assert.equal(await restored.draft.flush(), true);
  assert.deepEqual(requests, [[{ productId: "a", countedQty: 8 }]]); assert.equal(store.has("user:count"), false);
 } finally { restored.draft.dispose(); }
});
test("approval clears the backup and disables further draft writes", async () => {
 const requests = []; const f = await fixture({ save: async rows => requests.push(rows) });
 try {
  f.draft.edit("a", 5); f.draft.receive(lines, false, true); f.draft.edit("a", 9); await f.draft.flush();
  assert.equal(f.store.has("user:count"), false); assert.equal(requests.length, 0);
  assert.equal(f.state().status, "Count approved"); assert.deepEqual(f.state().edits, {});
 } finally { f.draft.dispose(); }
});
test("leaving before the debounce preserves the backup without a background write", async () => {
 const requests = []; const f = await fixture({ save: async rows => requests.push(rows), delay: 10 });
 f.draft.edit("a", 7); f.draft.dispose(); await pause(25);
 assert.equal(requests.length, 0); assert.equal(JSON.parse(f.store.get("user:count")).edits.a, 7);
});
