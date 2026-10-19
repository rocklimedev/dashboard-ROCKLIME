const { test } = require("node:test");
const assert = require("node:assert/strict");
const service = require.resolve("../modules/settings/settings.service");
const { DEFAULTS } = require("../migrations/20261016000100-app-settings");
require.cache[service] = { id: service, filename: service, loaded: true, exports: { getSetting: async key => DEFAULTS[key] } };
const { renderQuotationPdf } = require("../modules/quotations/quotation-pdf");

test("hidden columns render safely and preserve totals and room page labels", async () => {
  const data = { quotation: { reference_number: "TEST", createdAt: "2026-10-19" }, items: [
    { productId: "1", name: "Tap", quantity: 2, price: 100, discount: 10, roomName: "Bathroom" },
    { productId: "2", name: "Sink", quantity: 1, price: 200, roomName: "Kitchen" },
  ], customer: {}, productInfo: {}, versionNo: 1 };
  const opts = { company: DEFAULTS.company, settings: DEFAULTS.quotation, cover: false };
  const normal = await renderQuotationPdf(data, opts);
  for (const hidden of [["mrp"], ["discount", "price", "total"], ["image", "name", "code", "sno", "qty", "mrp", "discount", "price", "total", "roomTotals"]]) {
    const custom = await renderQuotationPdf(data, { ...opts, exportOptions: { hidden } });
    assert.equal(custom.totals.grandTotal, normal.totals.grandTotal);
    assert.deepEqual(custom.pageLabels, ["Product list", "Bathroom", "Kitchen", "Quotation summary", "Terms"]);
    assert.ok(custom.buffer.subarray(0, 4).toString() === "%PDF");
  }
});

test("unchecked PDF fields are absent from extracted product and summary text", async () => {
  const { getDocument } = await import("../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const data = { quotation: { reference_number: "TEST", createdAt: "2026-10-19" }, items: [
    { productId: "1", name: "SECRET PRODUCT", companyCode: "SECRET-CODE", quantity: 2, price: 100, discount: 10, roomName: "Bathroom" },
  ], customer: {}, productInfo: {}, versionNo: 1 };
  const { buffer } = await renderQuotationPdf(data, { company: DEFAULTS.company, settings: DEFAULTS.quotation, cover: false,
    exportOptions: { hidden: ["name", "code", "image", "mrp", "discount", "price", "total"] } });
  const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  try {
    let content = "";
    for (let i = 1; i < pdf.numPages; i++) content += (await (await pdf.getPage(i)).getTextContent()).items.map(item => item.str).join(" ");
    assert.doesNotMatch(content, /SECRET PRODUCT|SECRET-CODE|MRP|Discount|Disc\.|Grand total|You save/);
  } finally { await pdf.destroy(); }
});
