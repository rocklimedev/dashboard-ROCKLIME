const test = require("node:test");
const assert = require("node:assert/strict");
const { Op } = require("sequelize");
const paginate = require("../modules/products/inventoryPagination");

const fixtures = Array.from({ length: 27 }, (_, i) => ({
  productId: String(i).padStart(2, "0"), quantity: i < 7 ? 0 : i < 17 ? 5 : 30,
  brandId: i % 2 ? "a" : "b", keywords: ["one", "two", "three"],
}));
function matches(p, where) {
  if (where[Op.and] && !where[Op.and].every((w) => matches(p, w))) return false;
  return Object.entries(where).every(([key, value]) => {
    if (typeof value !== "object") return p[key] === value;
    return Reflect.ownKeys(value).every((op) => op === Op.gt ? p[key] > value[op]
      : op === Op.lte ? p[key] <= value[op] : op === Op.in ? value[op].includes(p[key]) : false);
  });
}
function setup() {
  const queries = [];
  const Product = {
    count: async (q) => { assert.equal(q.distinct, true); return fixtures.filter((p) => matches(p, q.where)).length; },
    findAll: async (q) => {
      queries.push(q);
      const rows = fixtures.filter((p) => matches(p, q.where));
      if (q.limit) {
        assert.deepEqual(q.group, ["Product.productId"]);
        assert.deepEqual(q.include[0].attributes, []);
        return rows.slice(q.offset, q.offset + q.limit);
      }
      assert.equal(q.offset, undefined);
      return rows;
    },
  };
  return { Product, queries, Keyword: {}, Category: {}, where: {}, order: [["productId", "ASC"]], page: 1, limit: 10, tab: "all", threshold: 10 };
}

test("pages contain distinct products despite multiple keywords, with no omissions or overlap", async () => {
  const args = setup();
  const pages = [];
  for (const page of [1, 2, 3]) pages.push(await paginate({ ...args, page }));
  assert.deepEqual(pages.map((p) => p.products.length), [10, 10, 7]);
  assert.equal(new Set(pages.flatMap((p) => p.products.map((r) => r.productId))).size, 27);
  assert.deepEqual(pages[0].counts, { all: 27, inStock: 20, lowStock: 10, outStock: 7 });
});

test("tab totals stay global and combine stock conditions with brand and max stock", async () => {
  const args = setup();
  const where = { brandId: "a", quantity: { [Op.lte]: 10 } };
  for (const tab of ["all", "in-stock", "low-stock", "out-of-stock"]) {
    const result = await paginate({ ...args, where, tab });
    assert.deepEqual(result.counts, { all: 8, inStock: 5, lowStock: 5, outStock: 3 });
    assert.equal(result.total, tab === "all" ? 8 : tab === "out-of-stock" ? 3 : 5);
    assert.equal(result.products.length, result.total);
  }
});

test("out-of-range and empty pages return valid pagination", async () => {
  const args = setup();
  const last = await paginate({ ...args, page: 100 });
  assert.equal(last.page, 3);
  assert.equal(last.products.length, 7);
  const empty = await paginate({ ...args, where: { brandId: "missing" }, page: 100 });
  assert.equal(empty.page, 1);
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.products, []);
});
