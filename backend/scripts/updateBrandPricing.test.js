const test = require('node:test');
const assert = require('node:assert/strict');
const { reconcile, prepareImages, BRAND_ID, KEYS } = require('./updateBrandPricing');
const product = (overrides = {}) => ({
  productId: 'existing',
  brandId: BRAND_ID,
  product_code: 'ECLCO00000001',
  name: 'Old name',
  description: 'Custom description',
  quantity: 17,
  categoryId: 'keep-category',
  keywords: [{ id: 'keep-keyword' }],
  images: '["https://our-cdn/image.jpg"]',
  tax: '18.00',
  createdAt: 'old-created',
  updatedAt: 'old-updated',
  meta: { [KEYS.code]: '001-A', [KEYS.price]: 50, [KEYS.hsn]: 1234, custom: 'keep' },
  ...overrides,
});
const row = (overrides = {}) => ({
  brand: 'Colston',
  company_code: ' 001-a ',
  name: 'New name',
  selling_price: 0,
  hsn_code: '00123456',
  item_code: 100,
  unit: 'PCS',
  category: 'Goods',
  keywords: 'Later',
  G: 'Y',
  N: 5,
  ...overrides,
});
const now = '2026-11-04T00:00:00.000Z';

test('maps code, zero price, HSN, item ID, unit and name without altering inventory, identity or relationships', () => {
  const backup = [product(), product({ productId: 'other-brand', brandId: 'other' })];
  const original = structuredClone(backup);
  const result = reconcile(backup, [row()], { now });
  const output = result.existing[0];
  assert.equal(output.productId, 'existing');
  assert.equal(output.meta[KEYS.price], 0);
  assert.equal(output.meta[KEYS.hsn], '00123456');
  assert.equal(output.meta[KEYS.item], 100);
  assert.equal(output.meta[KEYS.unit], 'PCS');
  assert.equal(output.meta.custom, 'keep');
  for (const field of [
    'quantity',
    'product_code',
    'description',
    'categoryId',
    'keywords',
    'images',
    'tax',
    'createdAt',
  ])
    assert.deepEqual(output[field], backup[0][field]);
  assert.equal(output.name, 'New name');
  assert.equal(output.updatedAt, now);
  assert.equal(result.report.sourceReview[0].unmapped.N, 5);
  assert.deepEqual(backup, original);
});

test('duplicate source and ambiguous backup codes are rejected without guessing or creating replacements', () => {
  assert.equal(reconcile([product()], [row(), row()]).report.rejected.length, 2);
  const result = reconcile([product(), product({ productId: 'duplicate' })], [row()]);
  assert.equal(result.report.rejected[0].reason, 'ambiguous_backup_company_code');
  assert.equal(result.products.length, 0);
});

test('creates full product-format candidates with stable IDs and unique internal codes; other brands are excluded', () => {
  const source = { Sheet1: [row({ company_code: 'NEW' }), row({ brand: 'Other' })] };
  const first = reconcile([product()], source, { now, brands: ['Colston'] });
  const second = reconcile([product()], source, { now, brands: ['Colston'] });
  assert.deepEqual(first.added, second.added);
  assert.equal(first.added[0].brandId, BRAND_ID);
  assert.equal(first.added[0].quantity, 0);
  assert.equal(first.added[0].categoryId, null);
  assert.equal(first.added[0].tax, null);
  assert.equal(first.added[0].product_code, 'ECLCO00000002');
  assert.equal(first.report.excluded.length, 1);
  assert.equal(first.report.changes[0].sheet, 'Sheet1');
});

test('invalid price, missing code and malformed HSN cannot overwrite valid data', () => {
  for (const changes of [
    { selling_price: -1 },
    { selling_price: 'invalid' },
    { selling_price: null },
    { company_code: '' },
    { hsn_code: 'bad' },
  ]) {
    const result = reconcile([product()], [row(changes)]);
    assert.equal(result.products.length, 0);
    assert.equal(result.report.rejected.length, 1);
  }
});

test('image jobs fill empty products only, and tax stays unchanged by default', () => {
  const options = { now, taxColumn: 'N', imageColumn: 'B' };
  const source = [row({ B: 'https://brand/image.jpg' })];
  const first = reconcile([product()], source, options).existing[0];
  assert.equal(first.tax, '5.00');
  assert.equal(first.images, product().images);
  const second = reconcile([product({ images: '[]', description: 'Old name' })], source, options)
    .existing[0];
  const result = reconcile([product({ images: '[]' })], source, { now });
  assert.equal(result.existing[0].tax, '18.00');
  assert.equal(result.report.imageJobs[0].sourceUrl, 'https://brand/image.jpg');
  assert.equal(result.existing[0].images, '[]');
  assert.equal(second.description, 'New name');
});

test('all source brand labels map to the requested brand by default', () => {
  const result = reconcile(
    [product()],
    ['Colston', 'Colston Verron', 'Other', 'De Benos'].map((brand, i) =>
      row({ brand, company_code: `NEW-${i}` }),
    ),
  );
  assert.equal(result.added.length, 4);
  assert.ok(result.added.every((p) => p.brandId === BRAND_ID));
});

test('a changed company code with an existing item ID is held for review rather than duplicated', () => {
  const result = reconcile(
    [product({ meta: { [KEYS.code]: 'OLD-CODE', [KEYS.item]: 100 } })],
    [row({ company_code: 'NEW-CODE' })],
  );
  assert.equal(result.added.length, 0);
  assert.equal(result.report.rejected[0].reason, 'item_exists_with_different_company_code');
  assert.equal(result.report.rejected[0].candidates[0].companyCode, 'OLD-CODE');
});

test('downloads images, detects real extension, writes CDN links and reuses cached files', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const sharp = require('sharp');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-pricing-'));
  try {
    const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'white' } })
      .png()
      .toBuffer();
    let calls = 0;
    const fetchImage = async () => {
      calls++;
      return new Response(image);
    };
    const result = reconcile(
      [product({ images: '[]' })],
      [row({ B: 'https://source/image.jpg' })],
      { now },
    );
    await prepareImages(result, directory, { fetchImage });
    const saved = result.report.images.downloaded[0];
    assert.match(saved.filename, /\.png$/);
    assert.equal(result.existing[0].images, JSON.stringify([saved.cdnUrl]));
    assert.ok(saved.cdnUrl.startsWith('https://media.cmtradingco.com/product_images/colston/'));
    assert.deepEqual(fs.readFileSync(path.join(directory, 'images', saved.filename)), image);
    await prepareImages(result, directory, { fetchImage });
    assert.equal(calls, 1);
    assert.equal(result.report.images.downloaded[0].cached, true);
    const failure = reconcile([product({ images: '[]' })], [row({ B: 'https://source/fail' })], {
      now,
    });
    await prepareImages(failure, directory, {
      fetchImage: async () => new Response('missing', { status: 404 }),
    });
    assert.equal(failure.report.images.failed.length, 1);
    assert.equal(failure.existing[0].images, '[]');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('blank optional cells preserve values and unchanged products retain timestamps', () => {
  const existing = product({
    name: 'New name',
    meta: { [KEYS.code]: '001-a', [KEYS.price]: 0, [KEYS.hsn]: 1234 },
  });
  const result = reconcile([existing], [row({ hsn_code: '', item_code: null, unit: '' })], { now });
  assert.equal(result.existing[0].meta[KEYS.hsn], 1234);
  assert.equal(result.existing[0].updatedAt, 'old-updated');
});
