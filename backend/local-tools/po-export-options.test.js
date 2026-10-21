const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { DEFAULTS } = require('../migrations/20261016000100-app-settings');
const service = require.resolve('../modules/settings/settings.service');
require.cache[service] = {
  id: service,
  filename: service,
  loaded: true,
  exports: { getSetting: async (key) => DEFAULTS[key] },
};
const { renderPoPdf } = require('../modules/purchase-order/po-pdf');
const { poTotals } = require('../lib/poMath');
const items = [
  {
    productId: '1',
    productName: 'SECRET PRODUCT',
    companyCode: 'SECRET-CODE',
    hsn: 'SECRET-HSN',
    quantity: 2,
    unitPrice: 1234,
    discount: 10,
    tax: 18,
  },
];
const po = { poNumber: 'TEST', orderDate: '2026-10-19', items, freight: 100 };

test('PO PDF removes unchecked fields from product and summary pages without changing totals', async () => {
  const { getDocument } =
    await import('../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const base = {
    po,
    items,
    company: DEFAULTS.company,
    purchase: { terms: ['Test delivery terms'] },
    exportOptions: {},
  };
  const original = await renderPoPdf(base);
  for (const hidden of [
    ['name', 'code', 'hsn', 'discount', 'gst'],
    ['sno', 'name', 'code', 'hsn', 'qty', 'price', 'discount', 'gst', 'total'],
  ]) {
    const result = await renderPoPdf({ ...base, exportOptions: { hidden } });

    assert.equal(result.totals.grandTotal, original.totals.grandTotal);
    const pdf = await getDocument({ data: new Uint8Array(result.buffer), useSystemFonts: true })
      .promise;
    try {
      let content = '';
      for (let i = 1; i <= pdf.numPages; i++)
        content += (await (await pdf.getPage(i)).getTextContent()).items
          .map((item) => item.str)
          .join(' ');
      const compact = content.replace(/\s/g, '').toUpperCase();
      assert.doesNotMatch(
        compact,
        /SECRETPRODUCT|SECRET-CODE|SECRET-HSN|DISCOUNT|DISC\.|GSTSUMMARY|CGST|SGST|IGST/,
      );
      if (hidden.includes('total')) assert.doesNotMatch(compact, /POTOTAL/);
    } finally {
      await pdf.destroy();
    }
  }
});

test('PO Excel serializes only selected fields and preserves the original PO', async () => {
  const ExcelJS = require('../../frontend-v2/node_modules/exceljs');
  const source = fs
    .readFileSync(require.resolve('../../frontend-v2/src/concepts/PO/poExport.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/export (const|async function|function)/g, '$1')
    .replace('await import("exceljs")', '{ default: ExcelModule }');
  const build = new Function('ExcelModule', 'poTotals', source + '; return buildPoExcel;')(
    ExcelJS,
    poTotals,
  );
  const before = JSON.stringify(po);
  for (const hidden of [[], ['name', 'code', 'hsn', 'price', 'discount', 'gst', 'total']]) {
    const blob = await build(po, hidden);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await blob.arrayBuffer()));
    const values = [];
    workbook.eachSheet((sheet) =>
      sheet.eachRow((row) => row.eachCell((cell) => values.push(String(cell.value)))),
    );
    assert.ok(values.includes('Quantity'));
    if (hidden.length) {
      assert.ok(!values.some((value) => /SECRET|Discount|GST|Unit price|Amount/.test(value)));
      assert.equal(workbook.worksheets.length, 1);
    } else {
      assert.ok(values.includes('SECRET PRODUCT'));
      assert.ok(values.includes(String(poTotals({ items, freight: 100 }).grandTotal)));
    }
  }
  assert.equal(JSON.stringify(po), before);
});

test('default PO layout matches the original renderer', async () => {
  const path = require('node:path');
  const Module = require('node:module');
  const { execFileSync } = require('node:child_process');
  const filename = require.resolve('../modules/purchase-order/po-pdf');
  const original = execFileSync('git', ['show', 'HEAD:backend/modules/purchase-order/po-pdf.js'], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '../..'),
  });
  const baseline = new Module(filename, module);
  baseline.filename = filename;
  baseline.paths = Module._nodeModulePaths(path.dirname(filename));
  baseline._compile(original, filename);
  const { getDocument } =
    await import('../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const data = {
    po,
    items,
    company: DEFAULTS.company,
    purchase: { terms: ['Test delivery terms'] },
  };
  const extract = async (buffer) => {
    const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
    try {
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++)
        pages.push(
          (await (await pdf.getPage(i)).getTextContent()).items.map((item) => ({
            text: item.str,
            transform: item.transform,
          })),
        );
      return pages;
    } finally {
      await pdf.destroy();
    }
  };
  const before = await baseline.exports.renderPoPdf(data);
  const after = await renderPoPdf({ ...data, exportOptions: { hidden: [] } });
  assert.deepEqual(await extract(after.buffer), await extract(before.buffer));
});
