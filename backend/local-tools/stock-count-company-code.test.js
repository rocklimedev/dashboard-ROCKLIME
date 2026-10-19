const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { productCompanyCode } = require("../lib/productCompanyCode");
const key = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const fixtures = [
 [{ meta: { [key]: " CODE-123 " } }, "CODE-123"],
 [{ meta: JSON.stringify({ [key]: "CODE-456" }) }, "CODE-456"],
 [{ meta: JSON.stringify(JSON.stringify({ [key]: "CODE-789" })) }, "CODE-789"],
 [{ meta: [{ id: key, value: "ARRAY-CODE" }] }, "ARRAY-CODE"],
 [{ metaDetails: [{ id: key, slug: "companyCode", value: "DETAIL-CODE" }] }, "DETAIL-CODE"],
 [{ meta: { [key]: { value: "WRAPPED-CODE" } } }, "WRAPPED-CODE"],
 [{ meta: { company_code: "ALIAS-CODE" } }, "ALIAS-CODE"],
 [{ companyCode: "TOP-LEVEL" }, "TOP-LEVEL"],
 [{ meta: { [key]: 0 } }, "0"],
 [{ product_code: "INTERNAL-ONLY", meta: {} }, ""],
];
test("stock count company codes use the supplied UUID across supported metadata formats", () => {
 for (const [product, code] of fixtures) assert.equal(productCompanyCode(product), code);
 assert.equal(productCompanyCode({ meta: { custom: "DYNAMIC" } }, [{ id: "custom", title: "Company Code" }]), "DYNAMIC");
 assert.equal(productCompanyCode({ toJSON: () => ({ meta: { [key]: "MODEL-CODE" } }) }), "MODEL-CODE");
});
test("frontend catalog fallback and backend resolve the same company code", () => {
 const source = fs.readFileSync(require.resolve("../../frontend-v2/src/components/Quotation/productSyncHelpers.js"), "utf8");
 const code = source.slice(source.indexOf("const COMPANY_CODE_ID"), source.indexOf("export const productImage")).replace("export function", "function");
 const frontendCode = new Function(code + "; return productCompanyCode;")();
 for (const [product, expected] of fixtures) assert.equal(frontendCode(product), expected);
});
test("count API returns real company codes with unchanged count quantities and variance", async () => {
 const source = fs.readFileSync(require.resolve("../modules/stock/stock.controller"), "utf8");
 const code = source.slice(source.indexOf("exports.getCount ="), source.indexOf("exports.saveCountLines ="));
 const products = fixtures.map(([product], index) => ({ productId: String(index), name: "Product " + index, product_code: "INTERNAL-" + index, ...product }));
 const lines = products.map(product => ({ productId: product.productId, countedQty: 4, systemQty: 3, toJSON() { return { productId: this.productId, countedQty: 4, systemQty: 3 }; } }));
 const m = () => ({ StockCount: { findByPk: async () => ({ lines }) }, StockCountLine: {}, Product: { findAll: async options => { assert.equal(options.raw, true); assert.ok(options.attributes.includes("meta")); return products; } }, ProductMeta: { findAll: async () => [{ id: key, slug: "companyCode", title: "Company Code" }] } });
 const handler = new Function("m", "fail", "productCompanyCode", "const exports = {}; " + code + "; return exports.getCount;")(m, (_, error) => { throw error; }, productCompanyCode);
 let result;
 await handler({ params: { id: "count" } }, { json(value) { result = value; } });
 for (const [index, [, expected]] of fixtures.entries()) {
  const row = result.lines.find(line => line.productId === String(index));
  assert.equal(row.companyCode, expected || null); assert.equal(row.variance, 1); assert.equal(row.countedQty, 4);
 }
});
