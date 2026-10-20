const test = require("node:test");
const assert = require("node:assert/strict");
const service = require.resolve("../modules/settings/settings.service");
const { DEFAULTS } = require("../migrations/20261016000100-app-settings");
require.cache[service] = { id: service, filename: service, loaded: true, exports: { getSetting: async key => DEFAULTS[key] } };
const { orderDocument } = require("../modules/orders/order-document");
const { renderQuotationPdf } = require("../modules/quotations/quotation-pdf");

test("order document uses saved order prices and adjustments, with no cover", async () => {
  const source = orderDocument({ orderNo: "ORDER-42", createdFor: "customer-1", shipping: 25, gst: 18,
    extraDiscount: 10, extraDiscountType: "fixed", createdAt: "2026-10-20",
    products: JSON.stringify([{ name: "ORDER TAP", price: 100, quantity: 3, discount: 10, additionalDiscount: 2, total: 250 }]),
  });
  assert.equal(source.quotation.customerId, "customer-1");
  const result = await renderQuotationPdf({ ...source, customer: {}, productInfo: {} }, {
    company: DEFAULTS.company, settings: DEFAULTS.quotation, cover: false, documentLabel: "Order",
  });
  assert.equal(result.totals.goodsValue, 250);
  assert.equal(result.totals.taxableValue, 265);
  assert.equal(result.totals.grandTotal, 313);
  assert.ok(result.pageLabels.includes("Order summary"));
  const { getDocument } = await import("../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({ data: new Uint8Array(result.buffer), useSystemFonts: true }).promise;
  try {
    const text = (await (await doc.getPage(1)).getTextContent()).items.map(item => item.str).join(" ");
    assert.match(text, /ORDER TAP/);
    assert.match(text, /ORDER-42/);
  } finally { await doc.destroy(); }
});
