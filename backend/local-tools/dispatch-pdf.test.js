const test = require("node:test");
const assert = require("node:assert/strict");
const service = require.resolve("../modules/settings/settings.service");
const { DEFAULTS } = require("../migrations/20261016000100-app-settings");
require.cache[service] = { id: service, filename: service, loaded: true, exports: { getSetting: async key => DEFAULTS[key] } };
const { renderQuotationPdf } = require("../modules/quotations/quotation-pdf");
test("dispatch uses quotation layout, shipment quantities, named charges and export filters", async () => {
 const { getDocument } = await import("../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs");
 const data = { quotation: { reference_number: "Q1/D1", createdAt: "2026-10-19", miscellaneousChargeItems: [{ name: "Packing", amount: 20 }] },
  items: [{ productId: "tap", name: "BATCH TAP", companyCode: "TAP-CODE", quantity: 2, price: 100, roomName: "Bathroom" }], customer: {}, productInfo: {}, versionNo: 1 };
 const opts = { company: DEFAULTS.company, settings: DEFAULTS.quotation, cover: false };
 const standard = await renderQuotationPdf(data, opts);
 const dispatch = await renderQuotationPdf(data, { ...opts, documentLabel: "Dispatch" });
 assert.deepEqual(dispatch.pageLabels, standard.pageLabels.map(label => label.replace("Quotation", "Dispatch")));
 assert.equal(dispatch.totals.grandTotal, standard.totals.grandTotal);
 const pdf = await getDocument({ data: new Uint8Array(dispatch.buffer), useSystemFonts: true }).promise;
 try {
  let content = "";
  for (let i = 1; i <= pdf.numPages; i++) content += (await (await pdf.getPage(i)).getTextContent()).items.map(item => item.str).join(" ");
  assert.match(content, /Dispatch summary/); assert.match(content, /Packing/); assert.match(content, /BATCH TAP/);
  assert.doesNotMatch(content, /Quotation summary/);
 } finally { await pdf.destroy(); }
 const filtered = await renderQuotationPdf(data, { ...opts, documentLabel: "Dispatch", exportOptions: { hidden: ["image", "name", "code", "mrp", "discount", "price", "total"] } });
 assert.equal(filtered.totals.grandTotal, dispatch.totals.grandTotal);
 const hiddenPdf = await getDocument({ data: new Uint8Array(filtered.buffer), useSystemFonts: true }).promise;
 try {
  let text = "";
  for (let i = 1; i <= hiddenPdf.numPages; i++) text += (await (await hiddenPdf.getPage(i)).getTextContent()).items.map(item => item.str).join(" ");
  assert.doesNotMatch(text, /BATCH TAP|TAP-CODE|Grand total|Packing/);
 } finally { await hiddenPdf.destroy(); }
});
