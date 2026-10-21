const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ExcelJS = require('../../frontend-v2/node_modules/exceljs');
test('Excel removes unchecked columns and image assets from the serialized workbook', async () => {
  let workbook;
  class Workbook extends ExcelJS.Workbook {
    constructor() {
      super();
      workbook = this;
    }
  }
  const source = fs.readFileSync(
    require.resolve('../../frontend-v2/src/components/Quotation/hooks/exportHelpers.js'),
    'utf8',
  );
  const code = source
    .slice(source.indexOf('const computeRowPricing ='))
    .replace('export const exportToExcel', 'const exportToExcel');
  const dependencies = {
    ExcelJS: { Workbook },
    fetchImg: async () => null,
    placeholder: null,
    calcTotals: () => ({ subtotal: 180, gst: 0, total: 180 }),
    amountInWords: () => 'one hundred eighty',
    getSafeTitle: () => 'test',
    message: { success() {}, warning() {} },
    URL: {
      createObjectURL() {
        return 'blob:test';
      },
      revokeObjectURL() {},
    },
    document: {
      createElement: () => ({ click() {} }),
      body: { appendChild() {}, removeChild() {} },
    },
  };
  const exportExcel = new Function(...Object.keys(dependencies), code + '; return exportToExcel;')(
    ...Object.values(dependencies),
  );
  const products = [
    { name: 'SECRET PRODUCT', companyCode: 'SECRET-CODE', quantity: 2, price: 100, discount: 10 },
  ];
  for (const hidden of [[], ['image', 'name', 'code', 'mrp', 'discount', 'price', 'total']]) {
    await exportExcel({ products, exportOptions: { hidden } });
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(await workbook.xlsx.writeBuffer());
    const sheet = loaded.worksheets[0],
      values = [];
    sheet.eachRow((row) => row.eachCell((cell) => values.push(String(cell.value))));
    assert.ok(values.includes('Unit'));
    assert.ok(values.includes('2'));
    if (hidden.length) {
      assert.ok(
        !values.some((value) =>
          /SECRET PRODUCT|SECRET-CODE|^MRP$|^Discount$|^Rate$|^Total$/.test(value),
        ),
      );
      assert.equal(sheet.getImages().length, 0);
    } else {
      assert.ok(values.includes('SECRET PRODUCT'));
      assert.ok(values.includes('Discount'));
    }
  }
});

test('dispatch Excel uses the dispatch label, shipment totals and IGST without SGST', async () => {
  let workbook;
  class Workbook extends ExcelJS.Workbook {
    constructor() {
      super();
      workbook = this;
    }
  }
  const source = fs.readFileSync(
    require.resolve('../../frontend-v2/src/components/Quotation/hooks/exportHelpers.js'),
    'utf8',
  );
  const code = source
    .slice(source.indexOf('const computeRowPricing ='))
    .replace('export const exportToExcel', 'const exportToExcel');
  const dependencies = {
    ExcelJS: { Workbook },
    fetchImg: async () => null,
    placeholder: null,
    calcTotals: () => {
      throw new Error('Dispatch must use its authoritative totals');
    },
    amountInWords: () => 'amount',
    getSafeTitle: () => 'dispatch',
    message: { success() {}, warning() {} },
    URL: {
      createObjectURL() {
        return 'blob:test';
      },
      revokeObjectURL() {},
    },
    document: {
      createElement: () => ({ click() {} }),
      body: { appendChild() {}, removeChild() {} },
    },
  };
  const exportExcel = new Function(...Object.keys(dependencies), code + '; return exportToExcel;')(
    ...Object.values(dependencies),
  );
  const { quotationTotals } = require('../lib/quotationMath');
  const products = [
    { productId: 'p', name: 'Tap', quantity: 2, price: 100, flatPrice: 80, additionalDiscount: 5 },
  ];
  const q = { gst: 18, miscellaneousChargeItems: [{ name: 'Packing', amount: 10 }] };
  const totals = quotationTotals({ ...q, items: products, gstRate: 18, interState: true });
  await exportExcel({
    products,
    quotation: q,
    documentLabel: 'Dispatch',
    documentTotals: totals,
    exportOptions: { hidden: ['image'] },
  });
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = loaded.worksheets[0],
    values = [];
  sheet.eachRow((row) => row.eachCell((cell) => values.push(String(cell.value))));
  assert.equal(sheet.name, 'Dispatch');
  assert.equal(sheet.getCell('B2').value, 'Dispatch');
  assert.ok(values.includes('Packing'));
  assert.ok(values.includes('IGST'));
  assert.ok(!values.includes('SGST'));
  assert.ok(values.includes('189.00'));
  assert.ok(values.includes('₹75.00'));
});
