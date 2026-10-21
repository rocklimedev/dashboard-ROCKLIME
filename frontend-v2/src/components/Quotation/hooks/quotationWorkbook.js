import ExcelJS from 'exceljs';
import { isOptional, lineAmounts, quotationTotals, r2 } from '../../../utils/quotationMath.js';

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const list = (value) => {
  try {
    return Array.isArray(value) ? value : JSON.parse(value || '[]');
  } catch {
    return [];
  }
};
const money = '#,##0.00;[Red]-#,##0.00';

export const hasRoomAssignments = (products) =>
  products.some((product) =>
    (product.locations?.length ? product.locations : [product]).some(
      (location) =>
        (location.roomId || location.roomName?.trim()) &&
        number(location.assignedQuantity ?? product.quantity ?? product.qty ?? 1) > 0,
    ),
  );

const productImage = (product) => product.imageUrl || product.image || list(product.images)?.[0];

async function loadProductImage(source) {
  const response = await fetch(source, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Image unavailable');
  const bitmap = await createImageBitmap(await response.blob());
  try {
    const scale = Math.min(1, 240 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      base64: canvas.toDataURL('image/png'),
      extension: 'png',
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    bitmap.close();
  }
}

export async function addQuotationImages(
  workbook,
  { products, quotation = {}, selectedSheets },
  loadImage = loadProductImage,
) {
  const sheets = quotationSheets(products, quotation).filter(
    (sheet) => sheet.id !== 'summary' && (!selectedSheets || selectedSheets.includes(sheet.id)),
  );
  const sources = [
    ...new Set(
      sheets
        .flatMap((sheet) => sheet.rows.map(productImage))
        .filter((source) => typeof source === 'string' && source),
    ),
  ];
  const images = new Map();
  // Bound simultaneous downloads and reuse each embedded image across sheets.
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, sources.length) }, async () => {
      while (cursor < sources.length) {
        const source = sources[cursor++];
        try {
          const image = await loadImage(source);
          images.set(source, { ...image, id: workbook.addImage(image) });
        } catch {
          /* Keep exporting the product details if a photo cannot be loaded. */
        }
      }
    }),
  );
  sheets.forEach((sheet, index) => {
    const ws = workbook.worksheets[index];
    ws.getCell('V5').value = 'Product image';
    ws.getCell('V5').style = { ...ws.getCell('U5').style };
    ws.getColumn('V').width = 18;
    sheet.rows.forEach((product, rowIndex) => {
      const row = rowIndex + 6;
      const image = images.get(productImage(product));
      ws.getRow(row).height = 66;
      if (!image) {
        ws.getCell(`V${row}`).value = 'Image unavailable';
        return;
      }
      const scale = Math.min(100 / image.width, 78 / image.height);
      ws.addImage(image.id, {
        tl: { col: 21.1, row: row - 1 + 0.05 },
        ext: { width: image.width * scale, height: image.height * scale },
        editAs: 'oneCell',
      });
    });
    ws.autoFilter = `A5:V${Math.max(5, sheet.rows.length + 5)}`;
  });
}

export function quotationSheets(products, quotation = {}) {
  const floors = list(quotation.floors);
  const allocated = products.flatMap((product) => {
    const quantity = number(product.quantity ?? product.qty ?? 1);
    const locations = product.locations?.length
      ? product.locations
      : [{ ...product, assignedQuantity: quantity }];
    const shares = locations
      .map((location) => ({ ...location, assignedQuantity: number(location.assignedQuantity) }))
      .filter((location) => location.assignedQuantity > 0);
    const assigned = shares.reduce((sum, location) => sum + location.assignedQuantity, 0);
    if (assigned > quantity)
      throw new Error(
        `Location quantities exceed quantity for ${product.name || product.productId}`,
      );
    if (assigned < quantity) shares.push({ assignedQuantity: quantity - assigned });
    return shares.map((location) => {
      const floor = floors.find((f) => f.floorId === location.floorId);
      const room = floor?.rooms?.find((r) => r.roomId === location.roomId);
      return {
        ...product,
        ...location,
        quantity: location.assignedQuantity,
        floorName: location.floorName || floor?.floorName || 'Unassigned floor',
        roomName: location.roomName || room?.roomName || 'Unassigned room',
        floorKey: location.floorId || location.floorName || 'unassigned',
        roomKey: location.roomId || location.roomName || 'unassigned',
      };
    });
  });
  const hasRooms = hasRoomAssignments(products);
  const hasFloors = allocated.some((row) => row.floorKey !== 'unassigned');
  const sheets = [
    { id: 'products', label: 'Complete product list', rows: products },
    ...(hasRooms || hasFloors
      ? [
          {
            id: 'locations',
            label: hasRooms ? 'Floor / room product register' : 'Floor product register',
            rows: allocated,
          },
        ]
      : []),
  ];
  const groups = new Map();
  allocated.forEach((row) => {
    const floorId = JSON.stringify([row.floorKey]);
    const roomId = JSON.stringify([row.floorKey, row.roomKey]);
    for (const [id, label] of [
      ...(hasFloors ? [[`floor:${floorId}`, `Floor · ${row.floorName}`]] : []),
      ...(hasRooms ? [[`room:${roomId}`, `Room · ${row.floorName} / ${row.roomName}`]] : []),
    ]) {
      if (!groups.has(id)) groups.set(id, { id, label, rows: [] });
      groups.get(id).rows.push(row);
    }
  });
  return [
    ...sheets,
    ...groups.values(),
    { id: 'summary', label: 'Quotation summary', rows: products },
  ];
}

export function buildQuotationWorkbook({
  products,
  quotation = {},
  customerName = '',
  address = '',
  activeVersion = 'current',
  selectedSheets,
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CM Trading';
  wb.calcProperties.fullCalcOnLoad = true;
  const definitions = quotationSheets(products, quotation);
  const selected = definitions.filter(
    (sheet) => !selectedSheets || selectedSheets.includes(sheet.id),
  );
  if (!selected.length) throw new Error('Select at least one Excel sheet.');
  const names = new Set();
  const formula = (expression, result) => ({ formula: expression, result });
  const create = (label) => {
    const base =
      label
        .replace(/[\\/*?:[\]]/g, ' ')
        .replace(/'/g, '')
        .trim()
        .slice(0, 31) || 'Sheet';
    let name = base,
      suffix = 1;
    while (names.has(name.toLowerCase())) {
      const tail = ` (${suffix++})`;
      name = base.slice(0, 31 - tail.length) + tail;
    }
    names.add(name.toLowerCase());
    const ws = wb.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true },
    });
    ws.addRow([quotation.reference_number || 'Quotation', label]);
    ws.addRow(['Customer', customerName, 'Version', activeVersion]);
    ws.addRow(['Address', address]);
    ws.addRow([
      'Floor / room amounts are goods values; quotation adjustments and GST appear on the summary. Options are excluded from main totals.',
    ]);
    return ws;
  };
  for (const sheet of selected.filter((s) => s.id !== 'summary')) {
    const ws = create(sheet.label);
    ws.addRow([
      'S.No',
      'Product',
      'Company code',
      'Brand',
      'HSN',
      'Floor',
      'Room',
      'Area',
      'Type',
      'Unit',
      'Quantity',
      'MRP',
      'Discount type',
      'Discount',
      'Flat unit price',
      'Additional discount / unit',
      'Gross',
      'Line discount',
      'Net amount',
      'Net unit price',
      'Remarks',
    ]);
    sheet.rows.forEach((p, index) => {
      const a = lineAmounts(p),
        row = ws.rowCount + 1;
      const type = (p.discountType || 'percent').toLowerCase();
      ws.addRow([
        index + 1,
        p.name || p.productName || '',
        p.companyCode || p.productCode || '',
        p.brandName || p.brand || '',
        p.hsn || p.hsnCode || '',
        p.floorName || '',
        p.roomName || '',
        p.areaName || '',
        isOptional(p) ? 'Optional' : 'Main',
        p.unit || p.uom || '',
        a.qty,
        a.price,
        type,
        number(p.discount),
        p.flatPrice == null || p.flatPrice === '' ? null : number(p.flatPrice),
        number(p.additionalDiscount),
        formula(`ROUND(K${row}*L${row},2)`, a.gross),
        formula(`ROUND(IF(M${row}="percent",Q${row}*N${row}/100,N${row}*K${row}),2)`, a.discount),
        formula(
          `ROUND(IF(ISNUMBER(O${row}),O${row}*K${row},Q${row}-R${row})-P${row}*K${row},2)`,
          a.net,
        ),
        formula(`IFERROR(ROUND(S${row}/K${row},2),0)`, a.rate),
        p.remarks || p.remark || '',
      ]);
    });
    const end = ws.rowCount;
    for (const type of ['Main', 'Optional']) {
      const rows = sheet.rows.filter((p) => (isOptional(p) ? 'Optional' : 'Main') === type);
      const total = ws.addRow([`${type} totals`]);
      for (const [col, key] of [
        ['K', 'qty'],
        ['Q', 'gross'],
        ['R', 'discount'],
        ['S', 'net'],
      ]) {
        total.getCell(col).value = formula(
          end < 6 ? '0' : `SUMIF(I6:I${end},"${type}",${col}6:${col}${end})`,
          r2(rows.reduce((sum, p) => sum + lineAmounts(p)[key], 0)),
        );
      }
      total.font = { bold: true };
    }
    ws.autoFilter = `A5:U${Math.max(5, end)}`;
    ws.columns.forEach((column, index) => {
      column.width = [1, 5, 6, 20].includes(index) ? 30 : 18;
      if (index >= 10 && index !== 12) column.numFmt = money;
    });
  }
  if (selected.some((s) => s.id === 'summary')) {
    const ws = create('Quotation summary');
    const totals = quotationTotals({
      ...quotation,
      items: products,
      shipping: quotation.shippingAmount,
      gstRate: quotation.gst ?? quotation.gst_value,
    });
    ws.addRow(['Description', 'Amount / value']);
    const refs = {};
    const add = (key, label, value, expression) => {
      const row = ws.addRow([label, expression ? formula(expression, value) : value]);
      refs[key] = `B${row.number}`;
      return refs[key];
    };
    const main = products.filter((p) => !isOptional(p));
    const source = selected.find((s) => s.id === 'products');
    const productSheet = source ? wb.worksheets[0] : null;
    const productTotal = (col) =>
      productSheet ? `'${productSheet.name}'!${col}${6 + products.length}` : null;
    add(
      'gross',
      'MRP value',
      totals.mrpValue,
      productTotal('Q') ||
        main.map((p) => `ROUND(${lineAmounts(p).price}*${lineAmounts(p).qty},2)`).join('+') ||
        '0',
    );
    add(
      'discount',
      'Line discounts',
      totals.lineDiscount,
      productTotal('R') || main.map((p) => String(lineAmounts(p).discount)).join('+') || '0',
    );
    const netExpression = productSheet
      ? `'${productSheet.name}'!S${6 + products.length}`
      : main.map((p) => String(lineAmounts(p).net)).join('+') || '0';
    add(
      'net',
      'Net goods from products',
      r2(main.reduce((sum, p) => sum + lineAmounts(p).net, 0)),
      netExpression,
    );
    add(
      'flat',
      'Quotation flat price override (blank = use goods)',
      quotation.flatPrice == null || quotation.flatPrice === ''
        ? null
        : number(quotation.flatPrice),
    );
    add(
      'goods',
      'Goods value',
      totals.goodsValue,
      `IF(ISNUMBER(${refs.flat}),${refs.flat},${refs.net})`,
    );
    add('freight', 'Freight / installation', totals.freight);
    const charges = totals.miscellaneousChargeItems.map((charge, index) =>
      add(`charge${index}`, charge.name, charge.amount),
    );
    add(
      'charges',
      'Total miscellaneous charges',
      totals.miscellaneousCharges,
      charges.join('+') || '0',
    );
    add(
      'extraInput',
      `Extra discount (${quotation.extraDiscountType || 'percent'})`,
      number(quotation.extraDiscount),
    );
    add(
      'extra',
      'Extra discount amount',
      totals.extraDiscountAmount,
      (quotation.extraDiscountType || 'percent').toLowerCase() === 'percent'
        ? `ROUND((${refs.goods}+${refs.freight}+${refs.charges})*${refs.extraInput}/100,2)`
        : refs.extraInput,
    );
    add('additional', 'Additional quotation discount', number(quotation.additionalDiscount));
    add(
      'taxable',
      'Taxable value',
      totals.taxableValue,
      `ROUND(${refs.goods}+${refs.freight}+${refs.charges}-${refs.extra}-${refs.additional},2)`,
    );
    add('gstRate', 'GST rate (%)', totals.gstRate);
    add('gst', 'GST amount', totals.gstAmount, `ROUND(${refs.taxable}*${refs.gstRate}/100,2)`);
    add('cgst', 'CGST', totals.cgst, totals.interState ? '0' : `ROUND(${refs.gst}/2,2)`);
    add('sgst', 'SGST', totals.sgst, totals.interState ? '0' : `${refs.gst}-${refs.cgst}`);
    add('igst', 'IGST', totals.igst, totals.interState ? refs.gst : '0');
    add(
      'before',
      'Total before rounding',
      totals.beforeRound,
      `ROUND(${refs.taxable}+${refs.gst},2)`,
    );
    add('round', 'Round off', totals.roundOff, `ROUND(${refs.before},0)-${refs.before}`);
    add('grand', 'Grand total', totals.grandTotal, `ROUND(${refs.before},0)`);
    add(
      'optional',
      'Optional products (excluded from grand total)',
      totals.optionalTotal,
      productSheet
        ? `'${productSheet.name}'!S${7 + products.length}`
        : products
            .filter(isOptional)
            .map((p) => String(lineAmounts(p).net))
            .join('+') || '0',
    );
    ws.columns = [{ width: 68 }, { width: 28, numFmt: money }, { width: 20 }, { width: 24 }];
  }
  wb.worksheets.forEach((ws) => {
    ws.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF17365D' } };
    ws.getRow(5).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
    });
    ws.eachRow((row, index) => {
      row.height = index <= 4 ? 30 : 26;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });
    ws.headerFooter.oddFooter = 'Page &P of &N';
  });
  return wb;
}
