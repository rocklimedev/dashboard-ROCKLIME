import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { buildQuotationWorkbook, quotationSheets, addQuotationImages } from "./quotationWorkbook.js";
import { quotationTotals } from "../../../utils/quotationMath.js";

const products = [
  { name: "Tap", quantity: 3, price: 100, discount: 10, additionalDiscount: 2, locations: [
    { floorId: "f1", roomId: "r1", floorName: "Ground", roomName: "Bath", assignedQuantity: 1 },
    { floorId: "f2", roomId: "r2", floorName: "First", roomName: "Bath", assignedQuantity: 1 },
  ] },
  { name: "Sink", quantity: 2, price: 200, flatPrice: 0 },
  { name: "Option", quantity: 1, price: 999, isOptionFor: "tap" },
];

test("location register preserves quantities, separates same-name rooms and includes unassigned shares", () => {
  const sheets = quotationSheets(products);
  assert.equal(sheets.find(s => s.id === "locations").rows.reduce((sum, p) => sum + p.quantity, 0), 6);
  assert.equal(sheets.filter(s => s.id.startsWith("room:")).length, 3);
  assert.throws(() => quotationSheets([{ quantity: 1, locations: [{ assignedQuantity: 2 }] }]), /exceed/);
});

test("room export choices require actual room assignments", () => {
  const plain = [{ name: "Tap", quantity: 2, price: 100 }];
  assert.deepEqual(quotationSheets(plain).map(sheet => sheet.id), ["products", "summary"]);
  const floorOnly = quotationSheets([{ ...plain[0], floorName: "Ground" }]);
  assert.ok(floorOnly.some(sheet => sheet.id.startsWith("floor:")));
  assert.ok(!floorOnly.some(sheet => sheet.id.startsWith("room:")));
  assert.ok(quotationSheets([{ ...plain[0], roomName: "Bathroom" }]).some(sheet => sheet.id.startsWith("room:")));
});

test("photos are embedded on each product sheet, reused, and survive XLSX roundtrip", async () => {
  const items = products.map(product => ({ ...product, imageUrl: "photo.png" }));
  const wb = buildQuotationWorkbook({ products: items });
  let downloads = 0;
  await addQuotationImages(wb, { products: items }, async () => {
    downloads++;
    return { base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", extension: "png", width: 1, height: 1 };
  });
  assert.equal(downloads, 1);
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(await wb.xlsx.writeBuffer());
  for (const sheet of loaded.worksheets.slice(0, -1)) {
    assert.equal(sheet.getCell("V5").value, "Product image");
    assert.ok(sheet.getImages().length > 0);
    assert.equal(sheet.getRow(6).height, 66);
  }
  assert.equal(loaded.worksheets.at(-1).getImages().length, 0);
});

test("workbook formulas, cached totals and sheet selection survive XLSX roundtrip", async () => {
  const quotation = { extraDiscount: 10, extraDiscountType: "percent", additionalDiscount: 5, shippingAmount: 10, gst: 18, miscellaneousChargeItems: [{ name: "Packing", amount: 15 }] };
  const wb = buildQuotationWorkbook({ products, quotation });
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(await wb.xlsx.writeBuffer());
  const summary = loaded.worksheets.at(-1);
  const totals = quotationTotals({ ...quotation, items: products, shipping: 10, gstRate: 18 });
  const row = summary.getRows(1, summary.rowCount).find(row => row.getCell(1).value === "Grand total");
  assert.equal(row.getCell(2).value.result, totals.grandTotal);
  assert.match(row.getCell(2).value.formula, /ROUND/);
  assert.equal(wb.worksheets[0].getCell("S7").result ?? 0, 0);
  assert.match(loaded.worksheets[0].getCell("S7").value.formula, /ISNUMBER/);
  assert.equal(loaded.worksheets[0].getCell("S9").value.result, 264);
  assert.equal(loaded.worksheets[0].getCell("S10").value.result, 999);
  const onlySummary = buildQuotationWorkbook({ products, quotation, selectedSheets: ["summary"] });
  assert.equal(onlySummary.worksheets.length, 1);
  assert.throws(() => buildQuotationWorkbook({ products, selectedSheets: [] }), /Select at least/);
});
