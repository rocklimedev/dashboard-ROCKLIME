import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportInventoryExcel(snapshot, includeHistory) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CM Trading Co ERP';
  workbook.created = new Date(snapshot.exportedAt);
  const products = new Map(snapshot.products.map(product => [product.productId, product]));
  const users = new Map(snapshot.users.map(user => [user.userId, user.name || user.username]));
  const stock = workbook.addWorksheet('Selected products');
  stock.columns = [
    ['Product ID', 'productId', 38], ['Product name', 'name', 48], ['Company code', 'companyCode', 24],
    ['Internal product code', 'product_code', 24], ['Current stock', 'quantity', 18], ['Selling price (INR)', 'sellingPrice', 22],
    ['Status', 'status', 18], ['Updated at', 'updatedAt', 24], ['Description', 'description', 48], ['Metadata JSON', 'metadata', 48],
  ].map(([header, key, width]) => ({ header, key, width }));
  for (const product of snapshot.products) stock.addRow({ ...product, updatedAt: product.updatedAt ? new Date(product.updatedAt) : null, metadata: typeof product.meta === 'string' ? product.meta : JSON.stringify(product.meta || {}) });
  stock.getColumn('sellingPrice').numFmt = '#,##0.00';
  stock.getColumn('updatedAt').numFmt = 'yyyy-mm-dd hh:mm:ss';
  if (includeHistory) {
    const history = workbook.addWorksheet('Inventory history');
    history.columns = [
      ['Record ID', 'id', 38], ['Product ID', 'productId', 38], ['Product name', 'name', 48], ['Company code', 'companyCode', 24],
      ['Action', 'action', 20], ['Quantity change', 'change', 18], ['Quantity after', 'quantityAfter', 18],
      ['Order number', 'orderNo', 24], ['Changed by', 'user', 26], ['User ID', 'userId', 38], ['Date', 'createdAt', 24], ['Note', 'message', 60],
    ].map(([header, key, width]) => ({ header, key, width }));
    for (const record of snapshot.history) {
      const product = products.get(record.productId);
      history.addRow({ ...record, name: product?.name, companyCode: product?.companyCode, user: users.get(record.userId) || '', createdAt: record.createdAt ? new Date(record.createdAt) : null });
    }
    history.getColumn('createdAt').numFmt = 'yyyy-mm-dd hh:mm:ss';
  }
  workbook.eachSheet(sheet => {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: sheet.columnCount } };
    sheet.getRow(1).height = 26;
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    });
  });
  const bytes = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${includeHistory ? 'inventory-records' : 'selected-products'}-${snapshot.exportedAt.slice(0, 10)}.xlsx`);
}
