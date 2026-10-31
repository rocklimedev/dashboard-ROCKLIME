const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require.resolve('../modules/settings/settings.service');
const { DEFAULTS } = require('../migrations/20261016000100-app-settings');
require.cache[service] = {
  id: service,
  filename: service,
  loaded: true,
  exports: { getSetting: async (key) => DEFAULTS[key] },
};
const { renderQuotationPdf, groupByArea } = require('../modules/quotations/quotation-pdf');
const { quotationTotals } = require('../lib/quotationMath');

test('single products appear once with no location, one room, or legacy room fields', () => {
  for (const location of [
    {},
    { locations: [{ roomName: 'Master', assignedQuantity: 1 }] },
    { roomName: 'Master' },
  ]) {
    const items = [5998, 16998, 4798].map((price, index) => ({
      productId: String(index), quantity: 1, price, ...location,
    }));
    const totals = quotationTotals({ items });
    const { groups } = groupByArea(totals.lines);
    assert.deepEqual(groups.flatMap(group => group.rows.map(row => row.productId)), ['0', '1', '2']);
    assert.equal(groups.reduce((sum, group) => sum + group.net, 0), totals.goodsValue);
    assert.equal(groups.reduce((sum, group) => sum + group.mrp, 0), 27794);
  }
});

test('overlapping saved shares cannot double single products in quotation details', () => {
  const items = [5998, 16998, 4798].map((price, index) => ({
    productId: String(index),
    quantity: 1,
    price,
    locations: [{ assignedQuantity: 1 }, { assignedQuantity: 1 }],
  }));
  const original = JSON.stringify(items);
  const totals = quotationTotals({ items });
  const { groups } = groupByArea(totals.lines);
  assert.equal(groups[0].items, 3);
  assert.equal(groups[0].net, 27794);
  assert.equal(groups[0].net, totals.goodsValue);
  assert.equal(JSON.stringify(items), original);
});

test('PDF rooms follow saved share priorities independently of product array order', () => {
  const items = [
    {
      productId: 'a',
      quantity: 2,
      price: 100,
      priority: 0,
      locations: [
        { roomName: 'Master', assignedQuantity: 1, priority: 1 },
        { roomName: 'Parents', assignedQuantity: 1, priority: 0 },
      ],
    },
    {
      productId: 'b',
      quantity: 2,
      price: 100,
      priority: 1,
      locations: [
        { roomName: 'Master', assignedQuantity: 1, priority: 0 },
        { roomName: 'Parents', assignedQuantity: 1, priority: 1 },
      ],
    },
    { productId: 'c', quantity: 1, price: 100, priority: 1 },
    { productId: 'd', quantity: 1, price: 100, priority: 0 },
  ];
  const { groups } = groupByArea(quotationTotals({ items }).lines);
  assert.deepEqual(
    groups.map((group) => group.rows.map((row) => row.productId)),
    [
      ['b', 'a'],
      ['a', 'b'],
      ['d', 'c'],
    ],
  );
});

test('PDF single-location rows prefer location sequence and preserve ties', () => {
  const items = [
    {
      productId: 'a',
      quantity: 1,
      price: 100,
      priority: 0,
      locations: [{ roomName: 'Master', assignedQuantity: 1, priority: 1 }],
    },
    {
      productId: 'b',
      quantity: 1,
      price: 100,
      priority: 9,
      locations: [{ roomName: 'Master', assignedQuantity: 1, priority: 0 }],
    },
    { productId: 'c', quantity: 1, price: 100, priority: 1, roomName: 'Master' },
  ];
  const { groups } = groupByArea(quotationTotals({ items }).lines);
  assert.deepEqual(
    groups[0].rows.map((row) => row.productId),
    ['b', 'a', 'c'],
  );
});

test('room shares allocate calculated discounts once for percentage, fixed and flat prices', () => {
  for (const adjustments of [
    { discount: 50, discountType: 'percent' },
    { discount: 50, discountType: 'fixed' },
    { discount: 50, discountType: 'percent', flatPrice: 1900, additionalDiscount: 100 },
  ]) {
    const totals = quotationTotals({
      items: [
        {
          productId: 'tap',
          price: 4498,
          quantity: 3,
          ...adjustments,
          locations: [
            { roomName: 'Master', assignedQuantity: 1 },
            { roomName: 'Parents', assignedQuantity: 1 },
          ],
        },
      ],
    });
    const { groups } = groupByArea(totals.lines);
    assert.equal(groups.length, 3); // Includes the unassigned remaining unit.
    for (const group of groups) {
      assert.equal(group.mrp, 4498);
      assert.equal(group.net, totals.goodsValue / 3);
      assert.ok(group.net >= 0);
      assert.equal(group.rows[0].rate, totals.lines[0].rate);
    }
    assert.equal(
      groups.reduce((sum, group) => sum + group.net, 0),
      totals.goodsValue,
    );
  }
});

test('product pages stop at twelve rows and keep room totals with the final products', async () => {
  const { getDocument } =
    await import('../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  for (const count of [13, 15, 24, 25]) {
    const { buffer } = await renderQuotationPdf(
      {
        quotation: { reference_number: 'PAGINATION', createdAt: '2026-10-23' },
        items: Array.from({ length: count }, (_, index) => ({
          productId: String(index),
          name: `PAGINATIONITEM${index + 1}END`,
          quantity: 1,
          price: 100,
          roomName: 'Bathroom',
        })),
        customer: {},
        productInfo: {},
        versionNo: 1,
      },
      { company: DEFAULTS.company, settings: DEFAULTS.quotation, cover: false },
    );
    const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
    try {
      let rows = 0;
      let foundTotals = false;
      for (let page = 1; page <= pdf.numPages; page++) {
        const content = (await (await pdf.getPage(page)).getTextContent()).items
          .map((item) => item.str)
          .join(' ');
        const productsOnPage = content.match(/PAGINATIONITEM\d+END/g) || [];
        assert.ok(productsOnPage.length <= 12, `too many products on page ${page}`);
        rows += productsOnPage.length;
        if (content.includes('Subtotal')) {
          foundTotals = true;
          assert.ok(
            content.includes(`PAGINATIONITEM${count}END`),
            'room totals must stay with the last product',
          );
        }
      }
      assert.equal(rows, count);
      assert.ok(foundTotals);
    } finally {
      await pdf.destroy();
    }
  }
});

test('hidden columns render safely and preserve totals and room page labels', async () => {
  const data = {
    quotation: { reference_number: 'TEST', createdAt: '2026-10-19' },
    items: [
      { productId: '1', name: 'Tap', quantity: 2, price: 100, discount: 10, roomName: 'Bathroom' },
      { productId: '2', name: 'Sink', quantity: 1, price: 200, roomName: 'Kitchen' },
    ],
    customer: {},
    productInfo: {},
    versionNo: 1,
  };
  const opts = { company: DEFAULTS.company, settings: DEFAULTS.quotation, cover: false };
  const normal = await renderQuotationPdf(data, opts);
  for (const hidden of [
    ['mrp'],
    ['discount', 'price', 'total'],
    ['image', 'name', 'code', 'sno', 'qty', 'mrp', 'discount', 'price', 'total', 'roomTotals'],
  ]) {
    const custom = await renderQuotationPdf(data, { ...opts, exportOptions: { hidden } });
    assert.equal(custom.totals.grandTotal, normal.totals.grandTotal);
    assert.deepEqual(custom.pageLabels, [
      'Product list',
      'Bathroom',
      'Kitchen',
      'Quotation summary',
      'Terms',
    ]);
    assert.ok(custom.buffer.subarray(0, 4).toString() === '%PDF');
  }
});

test('unchecked PDF fields are absent from extracted product and summary text', async () => {
  const { getDocument } =
    await import('../../frontend-v2/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const data = {
    quotation: { reference_number: 'TEST', createdAt: '2026-10-19' },
    items: [
      {
        productId: '1',
        name: 'SECRET PRODUCT',
        companyCode: 'SECRET-CODE',
        quantity: 2,
        price: 100,
        discount: 10,
        roomName: 'Bathroom',
      },
    ],
    customer: {},
    productInfo: {},
    versionNo: 1,
  };
  const { buffer } = await renderQuotationPdf(data, {
    company: DEFAULTS.company,
    settings: DEFAULTS.quotation,
    cover: false,
    exportOptions: { hidden: ['name', 'code', 'image', 'mrp', 'discount', 'price', 'total'] },
  });
  const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  try {
    let content = '';
    for (let i = 1; i < pdf.numPages; i++)
      content += (await (await pdf.getPage(i)).getTextContent()).items
        .map((item) => item.str)
        .join(' ');
    assert.doesNotMatch(
      content,
      /SECRET PRODUCT|SECRET-CODE|MRP|Discount|Disc\.|Grand total|You save/,
    );
  } finally {
    await pdf.destroy();
  }
});
