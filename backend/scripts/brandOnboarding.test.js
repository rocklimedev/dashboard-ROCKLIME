const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePayload, createService } = require("../modules/products/brandOnboarding.service");
const body = () => ({ brandName: "New Brand", rows: [{ sourceRow: 2, name: "Tap", product_code: "00123", companyCode: "0001", quantity: "4", sellingPrice: "0", category: "Taps", parentCategory: "Bathroom", keywords: "tap", images: "https://example.com/tap.jpg", extended: { finish: "Chrome" } }], fields: [{ key: "finish", title: "Finish", fieldType: "string" }] });
function setup(failure = false) {
  let committed = false; let rolledBack = false;
  const writes = []; let sequence = 0;
  const table = (type) => ({
    findAll: async () => [], findByPk: async () => null, findOne: async () => null,
    create: async (data, options) => {
      assert.ok(options.transaction);
      if (failure && type === "Product") throw new Error("Insert failed");
      const record = { ...data, id: `${type}-${++sequence}`, productId: "product-id", categoryId: "category-id" };
      writes.push({ type, data }); return record;
    },
    findOrCreate: async (options) => {
      assert.ok(options.transaction);
      const record = { ...options.defaults, id: `${type}-${++sequence}` };
      writes.push({ type, data: options.defaults }); return [record, true];
    },
  });
  const models = { sequelize: { transaction: async (fn) => {
    try { const result = await fn({ id: "transaction" }); committed = true; return result; }
    catch (error) { rolledBack = true; throw error; }
  } } };
  for (const name of ["Brand", "Product", "ProductMeta", "Category", "ParentCategory", "Keyword", "ProductKeyword", "InventoryHistory"]) models[name] = table(name);
  return { service: createService(models), models, writes, state: () => ({ committed, rolledBack }) };
}
test("preserves zero prices and leading-zero codes while validating duplicate/numeric rows", () => {
  const payload = body();
  const valid = validatePayload(payload);
  assert.equal(valid.rows[0].product_code, "00123");
  assert.equal(valid.rows[0].companyCode, "0001");
  assert.equal(valid.rows[0].sellingPrice, 0);
  const formatted = body();
  formatted.rows[0].sellingPrice = "₹1,500.50";
  formatted.rows[0].quantity = "1,000";
  assert.equal(validatePayload(formatted).rows[0].sellingPrice, 1500.5);
  assert.equal(validatePayload(formatted).rows[0].quantity, 1000);
  payload.rows.push({ ...payload.rows[0], quantity: "not a number", sellingPrice: "-1" });
  assert.equal(validatePayload(payload).errors.length, 1);
  assert.equal(validatePayload(payload).errors[0].messages.length, 3);
});
test("preview makes no changes and reports existing product-code conflicts", async () => {
  const { service, writes, models } = setup();
  models.Product.findAll = async () => [{ product_code: "00123" }];
  const preview = await service.preview(body());
  assert.equal(preview.errors.length, 1);
  assert.equal(preview.summary.extendedFields[0].action, "Create");
  assert.deepEqual(writes, []);
});
test("creates brand, category, metadata, product, keyword links and initial stock together", async () => {
  const { service, writes, state } = setup();
  const result = await service.commit(body(), "user-id");
  assert.equal(result.products, 1);
  assert.equal(state().committed, true);
  const product = writes.find((w) => w.type === "Product").data;
  assert.equal(product.quantity, 4);
  assert.equal(product.meta["9ba862ef-f993-4873-95ef-1fef10036aa5"], 0);
  assert.ok(Object.values(product.meta).includes("Chrome"));
  assert.ok(writes.some((w) => w.type === "ProductKeyword"));
  assert.equal(writes.find((w) => w.type === "InventoryHistory").data.quantityAfter, 4);
});
test("failed product creation rolls back the complete catalog import", async () => {
  const { service, state } = setup(true);
  await assert.rejects(service.commit(body(), "user-id"), /Insert failed/);
  assert.deepEqual(state(), { committed: false, rolledBack: true });
});
