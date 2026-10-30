// Pricing modes: generic (today's maths), advanced-exclusive (D2) and advanced-inclusive (D1).
//   node --test local-tools/quotation-pricing-modes.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { quotationTotals, resolvePricingMode, pricingFromRecord } = require('../lib/quotationMath');

const line = (price, extra = {}) => ({ price, quantity: 1, discount: 0, ...extra });

test('D1 advanced-inclusive: 1180 less 10% is 1062, GST 162 is extracted, not added', () => {
  const t = quotationTotals({
    items: [line(1180, { discount: 10, discountType: 'percent' })],
    gstRate: 18,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
  });
  assert.equal(t.grandTotal, 1062);
  assert.equal(t.gstAmount, 162);
  assert.equal(t.taxableValue, 900);
  assert.equal(t.cgst + t.sgst, 162);
  assert.equal(t.roundOff, 0);
  assert.equal(t.pricingMode, 'advanced-inclusive');
});

test('D2 retains precision internally and displays two decimals without repricing', () => {
  const t = quotationTotals({
    items: [line(1180, { discount: 10, discountType: 'percent' })],
    gstRate: 18,
    discountMode: 'advanced',
    gstBasis: 'exclusive',
  });
  assert.equal(t.taxableValue, 900);
  assert.equal(t.gstAmount, 162);
  assert.equal(t.grandTotal, 1062);
  assert.equal(t.lines[0].d1DiscountPercent, 10);
  assert.equal(t.lines[0].d2DiscountPercent.toFixed(2), '23.73');
  assert.ok(Math.abs(t.lines[0].d2DiscountPercent - 23.7288135593) < 1e-9);
  assert.equal(t.lines[0].net, 900);
  assert.equal(t.pricingMode, 'advanced-exclusive');
});

test('advanced-exclusive converts each D1 price before quotation adjustments', () => {
  const input = {
    items: [
      line(4850, { quantity: 3, discount: 5, discountType: 'percent' }),
      line(18900, { quantity: 2, discount: 8, discountType: 'percent' }),
    ],
    shipping: 500,
    extraDiscount: 3,
    gstRate: 18,
  };
  const generic = quotationTotals(input);
  const advanced = quotationTotals({ ...input, discountMode: 'advanced', gstBasis: 'exclusive' });
  const inclusive = quotationTotals({ ...input, discountMode: 'advanced', gstBasis: 'inclusive' });
  assert.equal(advanced.goodsValue, Math.round(inclusive.goodsValue / 1.18 * 100) / 100);
  assert.equal(advanced.freight, 423.73);
  assert.equal(advanced.grandTotal, inclusive.grandTotal);
  assert.equal(advanced.beforeRound, inclusive.beforeRound);
  assert.equal(Math.round((advanced.taxableValue + advanced.gstAmount) * 100) / 100, advanced.beforeRound);
  assert.ok(advanced.grandTotal < generic.grandTotal);
});

test('each item derives its own D2 from its own D1, including a zero discount', () => {
  const t = quotationTotals({
    discountMode: 'advanced', gstBasis: 'exclusive', gstRate: 18,
    items: [
      line(1180, { quantity: 2, discount: 10, discountType: 'percent' }),
      line(2360, { discount: 50, discountType: 'percent' }),
      line(1180, { discount: 0, discountType: 'percent' }),
    ],
  });
  assert.deepEqual(t.lines.map((row) => row.d1DiscountPercent), [10, 50, 0]);
  for (const row of t.lines) {
    assert.ok(Math.abs(row.d2DiscountPercent - (100 - (100 - row.d1DiscountPercent) / 1.18)) < 1e-10);
  }
  assert.deepEqual(t.lines.map((row) => row.net), [1800, 1000, 1000]);
  assert.equal(t.grandTotal, 4484);
  assert.equal(t.gstAmount, 684);
});

test('D2 supports zero GST, fixed discounts, optional items and rounding', () => {
  const input = {
    discountMode: 'advanced', gstBasis: 'exclusive', gstRate: 18,
    items: [line(1180, { quantity: 2, discount: 118, discountType: 'fixed' }),
      line(1180, { isOption: true, discount: 10, discountType: 'percent' })],
  };
  const t = quotationTotals(input);
  assert.equal(t.grandTotal, 2124);
  assert.equal(t.optionalTotal, 900);
  assert.equal(t.optionalLines[0].d1DiscountPercent, 10);
  assert.equal(t.lines[0].discount, 560);
  const zero = quotationTotals({ ...input, gstRate: 0 });
  assert.equal(zero.grandTotal, 2124);
  assert.equal(zero.lines[0].d2DiscountPercent, 10);
  const rounded = quotationTotals({ ...input, items: [line(1180.59)], shipping: 10, extraDiscount: 5, extraDiscountType: 'fixed' });
  assert.equal(rounded.beforeRound, 1185.59);
  assert.equal(rounded.grandTotal, 1186);
  assert.equal(rounded.roundOff, 0.41);
});

test('generic ignores the GST basis and always runs exclusive arithmetic', () => {
  const plain = quotationTotals({ items: [line(1180)], gstRate: 18 });
  const withBasis = quotationTotals({
    items: [line(1180)],
    gstRate: 18,
    discountMode: 'generic',
    gstBasis: 'inclusive',
  });
  assert.equal(withBasis.grandTotal, plain.grandTotal);
  assert.equal(withBasis.grandTotal, 1392); // 1180 + 212.40, rounded
  assert.equal(withBasis.pricingMode, 'generic');
});

test('advanced with no GST basis chosen is refused, never defaulted', () => {
  assert.throws(
    () =>
      quotationTotals({
        items: [line(100)],
        gstRate: 18,
        discountMode: 'advanced',
        gstBasis: null,
      }),
    (e) => e.status === 400 && /Choose GST inclusive or exclusive/.test(e.message),
  );
  assert.equal(resolvePricingMode({ discountMode: 'advanced' }).pricingMode, null);
});

test('inter-state inclusive quotation shows IGST for the extracted GST', () => {
  const t = quotationTotals({
    items: [line(1180)],
    gstRate: 18,
    interState: true,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
  });
  assert.equal(t.igst, 180);
  assert.equal(t.cgst, 0);
  assert.equal(t.grandTotal, 1180);
  assert.equal(t.taxableValue, 1000);
});

test('inclusive with rate 0 has no GST and the total is the price', () => {
  const t = quotationTotals({
    items: [line(500)],
    gstRate: 0,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
  });
  assert.equal(t.gstAmount, 0);
  assert.equal(t.taxableValue, 500);
  assert.equal(t.grandTotal, 500);
});

test('inclusive rounds the payable amount, and the rounding is shown as round-off', () => {
  const t = quotationTotals({
    items: [line(1062.4)],
    gstRate: 18,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
  });
  assert.equal(t.grandTotal, 1062);
  assert.equal(t.roundOff, -0.4);
  assert.equal(t.gstAmount, 162);
  assert.equal(t.taxableValue, 900);
});

test('pricingFromRecord: old quotations stay generic, new ones use their saved basis', () => {
  assert.deepEqual(pricingFromRecord({}), {
    discountMode: 'generic',
    gstBasis: null,
    gstInclusive: false,
  });
  assert.deepEqual(pricingFromRecord({ gstInclusive: true }), {
    discountMode: 'generic',
    gstBasis: null,
    gstInclusive: false,
  });
  assert.deepEqual(pricingFromRecord({ discountMode: 'advanced', gstBasis: 'inclusive' }), {
    discountMode: 'advanced',
    gstBasis: 'inclusive',
    gstInclusive: true,
  });
  // Legacy boolean is honoured only when the new basis was never sent.
  assert.deepEqual(pricingFromRecord({ discountMode: 'advanced', gstInclusive: true }), {
    discountMode: 'advanced',
    gstBasis: 'inclusive',
    gstInclusive: true,
  });
  assert.deepEqual(pricingFromRecord({ discountMode: 'advanced', gstBasis: null }), {
    discountMode: 'advanced',
    gstBasis: null,
    gstInclusive: false,
  });
});

test('controller no longer zeroes GST for inclusive quotations', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '../modules/quotations/quotation.controller.js'),
    'utf8',
  );
  assert.equal(/gstInclusive\s*\?\s*0\s*:/.test(src), false, 'GST must not be forced to 0');
});

test('explicit null never falls back to the legacy GST boolean', () => {
  const p = pricingFromRecord({ discountMode: 'advanced', gstBasis: null, gstInclusive: true });
  assert.equal(p.gstBasis, null);
  assert.throws(
    () => quotationTotals(p),
    (e) => e.status === 400,
  );
});

test('GST defaults accept omissions and preserve explicit zero', () => {
  const { resolveGstRate } = require('../lib/quotationPricing');
  for (const value of [undefined, null, ''])
    assert.equal(resolveGstRate(value, { defaultGstRate: 12 }), 12);
  assert.equal(resolveGstRate(0, { defaultGstRate: 12 }), 0);
  assert.equal(resolveGstRate('0', { defaultGstRate: 12 }), 0);
});

test('generic fixtures equal the saved pre-change outputs field for field', () => {
  const fixtures = require('./quotation-generic-snapshots.json');
  for (const { input, expected } of fixtures) assert.deepEqual(quotationTotals(input), expected);
});

const load = require('./pricing-test-loader');
function controllerFixture(original = {}) {
  let saved;
  const quote = {
    quotationId: 'quote',
    customerId: 'customer',
    products: [line(1180)],
    ...original,
  };
  const Quotation = {
    findByPk: async () => quote,
    findOne: async ({ where }) => (where.quotationId ? quote : null),
    create: async (value) => {
      saved = value;
      return { ...value, toJSON: () => value };
    },
    update: async (value) => {
      saved = value;
    },
  };
  const chain = {
    sort() {
      return this;
    },
    lean: async () => null,
  };
  const transaction = {
    LOCK: { UPDATE: 'update' },
    commit: async () => {},
    rollback: async () => {},
  };
  const controller = load('../modules/quotations/quotation.controller.js', {
    '../settings/settings.service': { getSetting: async () => ({ defaultGstRate: 12 }) },
    '../../lib/documentExportFilename': {},
    uuid: { v4: () => 'uuid' },
    moment: () => ({
      format: () => '281026',
      startOf() {
        return this;
      },
      endOf() {
        return this;
      },
      toDate: () => new Date(),
    }),
    sequelize: { Op: {} },
    '../../config/database': { transaction: async () => transaction },
    '../../models': { Product: { findAll: async () => [] }, Quotation },
    './models/quotation-item.model': {
      findOne: () => ({ ...chain, then: (resolve) => Promise.resolve(null).then(resolve) }),
      create: async () => {},
      updateOne: async () => {},
    },
    './models/quotation-version.model': { findOne: () => chain, create: async () => {} },
    '../../utils/activityLogger': async () => {},
    '../engagement/notification.controller': {},
    './pipeline': { reopenIfExtended: async () => {} },
    './quotation-pdf': {},
    '../../lib/shareToken': {},
  });
  async function call(method, body = {}) {
    const result = { statusCode: 200 };
    await controller[method](
      { params: { id: 'quote' }, body, user: { userId: 'user' } },
      {
        status(code) {
          result.statusCode = code;
          return this;
        },
        json(data) {
          result.data = data;
          return this;
        },
      },
    );
    return { ...result, saved };
  }
  return call;
}

test('create and update use the configured GST rate and reject missing advanced basis with HTTP 400', async () => {
  for (const method of ['createQuotation', 'updateQuotation']) {
    for (const gst of [undefined, null, '', 0]) {
      const call = controllerFixture();
      const result = await call(method, { customerId: 'customer', products: [line(100)], gst });
      assert.equal(
        result.statusCode,
        method === 'createQuotation' ? 201 : 200,
        JSON.stringify(result.data),
      );
      assert.equal(result.saved.gst, gst === 0 ? 0 : 12);
    }
    const result = await controllerFixture()(method, {
      customerId: 'customer',
      products: [line(1180)],
      discountMode: 'advanced',
      gstBasis: null,
    });
    assert.equal(result.statusCode, 400, JSON.stringify(result.data));
    assert.equal(result.data.message, 'Choose GST inclusive or exclusive for advanced discounting');
  }
});

test('duplicate preserves an inclusive quotation basis and explicit rate, including zero', async () => {
  for (const gst of [18, 0, null]) {
    const result = await controllerFixture({
      discountMode: 'advanced',
      gstBasis: 'inclusive',
      gst,
    })('cloneQuotation');
    assert.equal(result.statusCode, 201, JSON.stringify(result.data));
    assert.equal(result.saved.gstBasis, 'inclusive');
    assert.equal(result.saved.discountMode, 'advanced');
    assert.equal(result.saved.gst, gst == null ? 12 : gst);
    assert.equal(result.saved.finalAmount, 1180);
  }
});

test('preset validation and company-wide seed use the configured GST rate', () => {
  const { seed, validatePresets } = require('../modules/settings/quotation-presets');
  const rows = seed({ defaultGstRate: 5 });
  assert.equal(rows[0].gstRate, 5);
  validatePresets(rows);
  assert.throws(() => validatePresets([...rows, { ...rows[0], id: 'second' }]), /Only one/);
  for (const patch of [
    { discountMode: 'wrong' },
    { discountMode: 'advanced', gstBasis: null },
    { gstBasis: 'wrong' },
  ])
    assert.throws(
      () => validatePresets([{ ...rows[0], ...patch }]),
      (e) => e.status === 400,
    );
});

test('preset CRUD replaces the default and deletion leaves imported quotation values intact', async () => {
  const base = require('../modules/settings/quotation-presets');
  let settings = { defaultGstRate: 12, discountPresets: base.seed({ defaultGstRate: 12 }) };
  const { mutatePreset } = load('../modules/settings/quotation-presets.js', {
    './settings.service': {
      getSetting: async () => structuredClone(settings),
      saveSetting: async (key, patch) => {
        settings = { ...settings, ...patch };
      },
    },
  });
  const rows = await mutatePreset(
    'POST',
    null,
    {
      name: 'Inclusive',
      discountMode: 'advanced',
      gstBasis: 'inclusive',
      gstRate: 5,
      isDefault: true,
    },
    'admin',
  );
  const imported = { ...rows[1] };
  assert.equal(rows.filter((p) => p.isDefault).length, 1);
  assert.equal(rows[0].isDefault, false);
  const updated = await mutatePreset('PUT', imported.id, { gstRate: 12 }, 'admin');
  assert.equal(updated[1].gstRate, 12);
  await mutatePreset('DELETE', imported.id, {}, 'admin');
  assert.equal(settings.discountPresets.length, 1);
  assert.equal(imported.gstRate, 5);
  await assert.rejects(
    () => mutatePreset('PUT', 'missing', {}, 'admin'),
    (e) => e.status === 404,
  );
});

test('preset routes expose CRUD and enforce administrator writes', async () => {
  const routes = [];
  const router = { use() {} };
  for (const method of ['get', 'post', 'put', 'delete'])
    router[method] = (path, handler) => routes.push({ method, path, handler });
  const seed = require('../modules/settings/quotation-presets').seed({ defaultGstRate: 12 });
  let mutations = 0;
  load('../modules/settings/settings.route.js', {
    express: { Router: () => router },
    '../../middleware/auth': { auth() {} },
    './settings.service': { getSetting: async () => ({ discountPresets: seed }), KEYS: [] },
    './quotation-presets': {
      mutatePreset: async () => {
        mutations++;
        return seed;
      },
    },
  });
  async function call(method, role) {
    const route = routes.find(
      (r) =>
        r.method === method &&
        (Array.isArray(r.path) ? r.path[0] : r.path) === '/quotation-discount-presets',
    );
    const result = { code: 200 };
    await route.handler(
      { user: { roles: [role], userId: 'user' }, params: {}, body: {} },
      {
        status(code) {
          result.code = code;
          return this;
        },
        json(body) {
          result.body = body;
        },
      },
      (error) => {
        throw error;
      },
    );
    return result;
  }
  assert.deepEqual((await call('get', 'SALES')).body.data, seed);
  for (const method of ['post', 'put', 'delete']) {
    assert.equal((await call(method, 'SALES')).code, 403);
    assert.equal((await call(method, 'ADMIN')).code, method === 'post' ? 201 : 200);
  }
  assert.equal(mutations, 3);
});

test('quotation conversion preserves inclusive mode and the order recalculates the same amount', async () => {
  const quote = {
    quotationId: 'quote',
    customerId: 'customer',
    shipTo: 'address',
    gst: 18,
    discountMode: 'advanced',
    gstBasis: 'inclusive',
    products: [{ productId: 'tap', ...line(1180, { discount: 10 }) }],
  };
  quote.toJSON = () => ({ ...quote });
  let saved;
  const { createQuotationOrder } = load('../modules/orders/quotation-order.js', {
    '../../models': {
      Order: {
        create: async (data) => {
          saved = data;
          return data;
        },
      },
      Address: { findByPk: async () => ({ customerId: 'customer' }) },
      User: { findByPk: async () => ({ status: true }) },
      Customer: { findByPk: async () => ({}) },
    },
    './order-number': async () => 'ORDER-1',
  });
  await createQuotationOrder(quote, [], { orderName: 'Inclusive order' }, 'user', {});
  assert.equal(saved.discountMode, 'advanced');
  assert.equal(saved.gstBasis, 'inclusive');
  assert.equal(saved.gst, 18);
  assert.equal(saved.finalAmount, 1062);
  const stubs = Object.fromEntries(
    [
      './models/order-item.model',
      './models/comment.model',
      'axios',
      'uuid',
      'basic-ftp',
      'sequelize',
      '../../config/database',
      'sanitize-html',
      'moment',
      '../../middleware/upload',
      '../engagement/notification.controller',
      '../../models',
      'pdfkit',
      '../../utils/activityLogger',
      './order-activity-logger',
      '../stock/stock.service',
      './order-number',
    ].map((id) => [id, {}]),
  );
  stubs.dotenv = { config() {} };
  const { computeTotals } = load('../modules/orders/order-controller.shared.js', stubs);
  const total = computeTotals(saved);
  assert.equal(total.finalAmount, 1062);
  assert.equal(total.gstValue, 162);
  assert.equal(total.taxableValue, 900);
});

test('quotation PDF, invoice and Tally use the same D1 payable total and extracted tax, including round-off', async () => {
  const { quotationPdfTotals } = load('../modules/quotations/quotation-pdf.js', {
    pdfkit: {},
    qrcode: {},
    '../../lib/quotationProducts': {},
    '../settings/settings.service': {},
  });
  for (const price of [1180, 1062.4]) {
    const quotation = { discountMode: 'advanced', gstBasis: 'inclusive', gst: 18 };
    const products = [{ productId: 'tap', ...line(price) }];
    const expected = quotationTotals({ ...quotation, items: products, gstRate: 18 });
    assert.deepEqual(
      quotationPdfTotals(quotation, products, false, { defaultGstRate: 5 }),
      expected,
    );
    const models = {
      TaxInvoice: { findAll: async () => [] },
      Product: { findAll: async () => [] },
      ProductMeta: { findAll: async () => [] },
      Customer: { findByPk: async () => null },
      Address: {},
    };
    const { draft } = load('../modules/invoices/invoice.service.js', {
      sequelize: {},
      '../../models': models,
      '../settings/settings.service': { getSetting: async () => ({ state: 'Delhi' }) },
    });
    const invoice = await draft({ ...quotation, id: 'order', status: 'PREPARING', products });
    assert.equal(invoice.total, expected.grandTotal);
    assert.equal(invoice.taxableValue, expected.taxableValue);
    assert.equal(invoice.cgst + invoice.sgst, expected.gstAmount);
    assert.equal(invoice.roundOff, expected.roundOff);
    const accounts = {
      tallySalesLedger: 'Sales',
      tallyFreightLedger: 'Freight',
      tallyCgstLedger: 'CGST',
      tallySgstLedger: 'SGST',
      tallyIgstLedger: 'IGST',
      tallyRoundOffLedger: 'Round',
    };
    const { tallyXml } = load('../modules/invoices/tally.js', {
      sequelize: { Op: {} },
      '../settings/settings.service': {
        getSetting: async (key) => (key === 'accounts' ? accounts : { name: 'Company' }),
      },
      '../../models': {
        TaxInvoice: {
          findAll: async () => [
            {
              toJSON: () => ({
                ...invoice,
                customerName: 'Buyer',
                invoiceNo: 'INV-1',
                invoiceDate: '2026-10-28',
              }),
            },
          ],
        },
        OrderPayment: { findAll: async () => [] },
        Customer: {},
      },
    });
    const { xml } = await tallyXml({ from: '2026-10-28', to: '2026-10-28' });
    const amounts = [...xml.matchAll(/<AMOUNT>([^<]+)<\/AMOUNT>/g)].map((m) => Number(m[1]));
    assert.equal(Math.round(amounts.reduce((a, b) => a + b, 0) * 100), 0, xml);
    assert.equal(amounts[0], -expected.grandTotal);
  }
});
