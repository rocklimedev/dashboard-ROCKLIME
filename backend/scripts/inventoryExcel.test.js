const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('../../frontend-v2/node_modules/exceljs');

test('Excel exports preserve numeric zero prices, selected identities and every history record', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend-v2/src/utils/inventoryExcel.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export async function', 'async function');
  let saved;
  const generate = new Function('ExcelJS', 'saveAs', 'Blob', `${source}\nreturn exportInventoryExcel;`)(ExcelJS, (blob, filename) => { saved = { blob, filename }; }, Blob);
  const snapshot = {
    exportedAt: '2026-10-12T10:00:00.000Z',
    products: [{ productId: 'one', name: '=SUM(A1:A9)', companyCode: 'CODE', product_code: 'INTERNAL', quantity: 0, sellingPrice: 0, updatedAt: '2026-10-12T10:00:00.000Z', meta: { keep: true } }, { productId: 'two', name: 'Variant', companyCode: 'CODE', quantity: 5, sellingPrice: 500 }],
    users: [{ userId: 'actor', name: 'Operator' }],
    history: Array.from({ length: 75 }, (_, index) => ({ id: String(index), productId: 'one', userId: 'actor', action: 'adjustment', change: -1, quantityAfter: index, createdAt: '2026-10-12T09:00:00.000Z', message: 'Reviewed stock' })),
  };
  await generate(snapshot, true);
  assert.equal(saved.filename, 'inventory-records-2026-10-12.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await saved.blob.arrayBuffer());
  const products = workbook.getWorksheet('Selected products');
  const history = workbook.getWorksheet('Inventory history');
  assert.equal(products.rowCount, 3); assert.equal(history.rowCount, 76);
  assert.equal(products.getCell('E2').value, 0); assert.equal(products.getCell('F2').value, 0);
  assert.equal(products.getCell('B2').value, '=SUM(A1:A9)'); assert.equal(products.getCell('B2').type, ExcelJS.ValueType.String);
  assert.equal(history.getCell('I2').value, 'Operator'); assert.equal(history.getCell('D2').value, 'CODE');
  assert.equal(history.getCell('F2').value, -1); assert.ok(history.getCell('K2').value instanceof Date);
  assert.ok(history.autoFilter); assert.equal(history.views[0].ySplit, 1);
  await generate(snapshot, false);
  const stockOnly = new ExcelJS.Workbook(); await stockOnly.xlsx.load(await saved.blob.arrayBuffer());
  assert.equal(stockOnly.worksheets.length, 1);
});
