// File-only reconciliation. No database connection or writes.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const BRAND_ID = 'acbe7061-9b76-47d1-a509-e4b1f982a36f';
const KEYS = {
  item: '1cf23921-49cd-11f1-93ac-52540021303b',
  hsn: '1cf286a9-49cd-11f1-93ac-52540021303b',
  unit: '1cf288ba-49cd-11f1-93ac-52540021303b',
  price: '9ba862ef-f993-4873-95ef-1fef10036aa5',
  code: 'd11da9f9-3f2e-4536-8236-9671200cca4a',
};
const present = (value) => value != null && String(value).trim() !== '';
const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();
function metaOf(product) {
  const meta = typeof product.meta === 'string' ? JSON.parse(product.meta) : product.meta;
  if (meta != null && (typeof meta !== 'object' || Array.isArray(meta))) {
    throw new Error(`Invalid metadata on ${product.productId}`);
  }
  return meta || {};
}
function stableId(code) {
  // UUID v5 using the brand UUID as the namespace; repeat runs keep new IDs stable.
  const bytes = createHash('sha1')
    .update(Buffer.from(BRAND_ID.replaceAll('-', ''), 'hex'))
    .update(code)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function sourceRows(source) {
  if (Array.isArray(source)) return source.map((row, i) => ({ row, sheet: null, rowIndex: i + 1 }));
  if (!source || typeof source !== 'object' || !Object.values(source).every(Array.isArray)) {
    throw new Error('Source must be an array or an object containing sheet arrays');
  }
  return Object.entries(source).flatMap(([sheet, rows]) =>
    rows.map((row, i) => ({ row, sheet, rowIndex: i + 1 })),
  );
}

function reconcile(backup, source, options = {}) {
  if (!Array.isArray(backup)) throw new Error('Backup must be a product array');
  const now = options.now || new Date().toISOString();
  const acceptedBrands = options.brands ? options.brands.map(normalize) : null;
  const includesBrand = (row) => !acceptedBrands || acceptedBrands.includes(normalize(row.brand));
  const brandProducts = backup.filter((p) => p.brandId === BRAND_ID);
  if (!brandProducts.length) throw new Error('Target brand is missing from the backup');
  const byCode = new Map();
  const byItem = new Map();
  const report = {
    brandId: BRAND_ID,
    acceptedBrands: acceptedBrands || 'all source brands',
    generatedAt: now,
    mapping: {
      name: 'name',
      item_code: `meta.${KEYS.item}`,
      company_code: `meta.${KEYS.code}`,
      selling_price: `meta.${KEYS.price}`,
      hsn_code: `meta.${KEYS.hsn}`,
      unit: `meta.${KEYS.unit}`,
      ...(options.taxColumn ? { [options.taxColumn]: 'tax' } : {}),
      B: 'images (download source image and fill empty only)',
    },
    deferredColumns: ['category', 'keywords', 'keyword_1', 'keyword_2'],
    rejected: [],
    excluded: [],
    changes: [],
    sourceReview: [],
    backupWithoutCode: [],
    unmatchedBackup: [],
    imageJobs: [],
    warnings: [],
  };
  for (const product of brandProducts) {
    const meta = metaOf(product);
    if (present(meta[KEYS.item])) {
      const item = normalize(meta[KEYS.item]);
      byItem.set(item, [...(byItem.get(item) || []), product]);
    }
    const aliases = [
      meta[KEYS.code],
      meta.companyCode,
      meta.company_code,
      product.companyCode,
      product.company_code,
    ];
    const codes = [...new Set(aliases.filter(present).map(normalize))];
    if (codes.length > 1) throw new Error(`Conflicting company codes on ${product.productId}`);
    if (!codes.length) {
      report.backupWithoutCode.push(product.productId);
      continue;
    }
    byCode.set(codes[0], [...(byCode.get(codes[0]) || []), product]);
  }
  const rows = sourceRows(source);
  const codeCounts = new Map();
  for (const { row } of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row))
      throw new Error('Invalid source row');
    if (includesBrand(row)) {
      const code = normalize(row.company_code);
      codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
    }
  }
  const existing = [],
    added = [],
    touched = new Set();
  const allCodes = new Set(backup.map((p) => normalize(p.product_code)));
  const allIds = new Set(backup.map((p) => p.productId));
  let sequence = Math.max(
    0,
    ...backup.map((p) => (/^ECLCO\d+$/.test(p.product_code) ? Number(p.product_code.slice(5)) : 0)),
  );
  const parents = [
    ...new Set(brandProducts.map((p) => p.brand_parentcategoriesId).filter(Boolean)),
  ];
  for (const entry of rows) {
    const { row, ...location } = entry;
    if (!row || typeof row !== 'object' || Array.isArray(row))
      throw new Error('Invalid source row');
    const code = normalize(row.company_code);
    if (!includesBrand(row)) {
      report.excluded.push({
        ...location,
        companyCode: code,
        reason: 'source_brand_excluded',
        source: row,
      });
      continue;
    }
    const matches = byCode.get(code) || [];
    let reason;
    if (!code) reason = 'missing_company_code';
    else if (!present(row.name)) reason = 'missing_name';
    else if (codeCounts.get(code) > 1) reason = 'duplicate_source_company_code';
    else if (matches.length > 1) reason = 'ambiguous_backup_company_code';
    else if (!matches.length && present(row.item_code) && byItem.has(normalize(row.item_code)))
      reason = 'item_exists_with_different_company_code';
    else if (
      typeof row.selling_price !== 'number' ||
      !Number.isFinite(row.selling_price) ||
      row.selling_price < 0
    )
      reason = 'invalid_price';
    else if (present(row.hsn_code) && !/^\d{4,8}$/.test(String(row.hsn_code).trim()))
      reason = 'invalid_hsn';
    else if (
      options.taxColumn &&
      present(row[options.taxColumn]) &&
      (!Number.isFinite(Number(row[options.taxColumn])) ||
        Number(row[options.taxColumn]) < 0 ||
        Number(row[options.taxColumn]) > 100)
    )
      reason = 'invalid_tax';
    if (reason) {
      const candidates = matches.length ? matches : byItem.get(normalize(row.item_code)) || [];
      report.rejected.push({
        ...location,
        companyCode: code,
        reason,
        productIds: candidates.map((p) => p.productId),
        candidates: candidates.map((p) => ({
          productId: p.productId,
          companyCode: metaOf(p)[KEYS.code],
          itemCode: metaOf(p)[KEYS.item],
          name: p.name,
        })),
        source: row,
      });
      continue;
    }
    const match = matches[0];
    let product;
    if (match) {
      product = { ...match, meta: { ...metaOf(match) } };
      touched.add(match.productId);
    } else {
      let internalCode;
      do {
        internalCode = `ECLCO${String(++sequence).padStart(8, '0')}`;
      } while (allCodes.has(internalCode));
      allCodes.add(internalCode);
      const id = stableId(code);
      if (allIds.has(id)) throw new Error(`Generated product ID already exists: ${id}`);
      allIds.add(id);
      product = {
        productId: id,
        name: String(row.name).trim(),
        product_code: internalCode,
        quantity: 0,
        masterProductId: null,
        isMaster: false,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
        discountType: null,
        alert_quantity: 1,
        tax: null,
        description: String(row.name).trim(),
        images: '[]',
        isFeatured: false,
        status: 'active',
        brandId: BRAND_ID,
        categoryId: null,
        vendorId: null,
        brand_parentcategoriesId: parents.length === 1 ? parents[0] : null,
        meta: {},
        createdAt: now,
        updatedAt: now,
      };
    }
    const before = structuredClone(product);
    product.name = String(row.name).trim();
    // Refresh auto-generated descriptions only; retain manually authored content.
    if (!present(product.description) || (match && product.description === match.name))
      product.description = product.name;
    product.meta[KEYS.code] = String(row.company_code).trim();
    product.meta[KEYS.price] = row.selling_price;
    for (const [column, key] of [
      ['item_code', KEYS.item],
      ['hsn_code', KEYS.hsn],
      ['unit', KEYS.unit],
    ]) {
      if (present(row[column]))
        product.meta[key] = typeof row[column] === 'string' ? row[column].trim() : row[column];
    }
    if (options.taxColumn && present(row[options.taxColumn]))
      product.tax = Number(row[options.taxColumn]).toFixed(2);
    const imageColumn = options.imageColumn || 'B';
    if (present(row[imageColumn])) {
      const image = String(row[imageColumn]).trim();
      const oldImages =
        typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      if (!oldImages || (Array.isArray(oldImages) && !oldImages.some(present))) {
        if (/^https?:\/\//i.test(image))
          report.imageJobs.push({
            productId: product.productId,
            companyCode: code,
            sourceUrl: image,
          });
        else
          report.warnings.push({
            companyCode: code,
            reason: 'source_image_is_not_a_url',
            value: row[imageColumn],
          });
      }
    }
    const changedFields = [];
    for (const field of ['name', 'description', 'tax', 'images']) {
      if (JSON.stringify(before[field]) !== JSON.stringify(product[field]))
        changedFields.push(field);
    }
    for (const key of Object.values(KEYS)) {
      if (JSON.stringify(before.meta[key]) !== JSON.stringify(product.meta[key]))
        changedFields.push(`meta.${key}`);
    }
    if (changedFields.length) product.updatedAt = now;
    (match ? existing : added).push(product);
    report.changes.push({
      ...location,
      companyCode: code,
      productId: product.productId,
      kind: match ? 'existing' : 'new',
      changedFields,
      oldPrice: match ? (before.meta[KEYS.price] ?? null) : null,
      newPrice: row.selling_price,
      oldHsn: match ? (before.meta[KEYS.hsn] ?? null) : null,
      newHsn: product.meta[KEYS.hsn] ?? null,
    });
    const mapped = new Set([
      'name',
      'company_code',
      'item_code',
      'hsn_code',
      'selling_price',
      'unit',
      'brand',
      options.taxColumn,
      imageColumn,
    ]);
    report.sourceReview.push({
      ...location,
      companyCode: code,
      productId: product.productId,
      unmapped: Object.fromEntries(Object.entries(row).filter(([key]) => !mapped.has(key))),
    });
  }
  report.unmatchedBackup = brandProducts
    .filter((p) => !touched.has(p.productId))
    .map((p) => ({ productId: p.productId, companyCode: metaOf(p)[KEYS.code] ?? null }));
  report.summary = {
    sourceRows: rows.length,
    backupProducts: backup.length,
    brandBackupProducts: brandProducts.length,
    matched: existing.length,
    changedExisting: report.changes.filter((c) => c.kind === 'existing' && c.changedFields.length)
      .length,
    priceChanges: report.changes.filter((c) => c.kind === 'existing' && c.oldPrice !== c.newPrice)
      .length,
    newProducts: added.length,
    rejected: report.rejected.length,
    excluded: report.excluded.length,
    untouchedBrandProducts: report.unmatchedBackup.length,
  };
  return { existing, added, products: [...existing, ...added], report };
}

async function prepareImages(result, out, options = {}) {
  const sharp = require('sharp');
  const imageDir = path.join(out, 'images');
  const cdnBase = (
    options.cdnBase || 'https://media.cmtradingco.com/product_images/colston'
  ).replace(/\/$/, '');
  if (!/^https:\/\//.test(cdnBase)) throw new Error('CDN base must be an HTTPS URL');
  const products = new Map(result.products.map((p) => [p.productId, p]));
  const changes = new Map(result.report.changes.map((c) => [c.productId, c]));
  result.report.images = {
    directory: imageDir,
    cdnBase,
    hostingStatus: 'local files staged; upload to CDN before importing image URLs',
    downloaded: [],
    failed: [],
  };
  fs.mkdirSync(imageDir, { recursive: true });
  const jobs = [...result.report.imageJobs];
  let completed = 0;
  async function worker() {
    while (jobs.length) {
      const job = jobs.shift();
      const stem = `${job.productId}-${createHash('sha256').update(job.sourceUrl).digest('hex').slice(0, 12)}`;
      try {
        let filename, data, format;
        const cached = fs
          .readdirSync(imageDir)
          .find((name) => name.startsWith(`${stem}.`) && !name.endsWith('.part'));
        if (cached) {
          const cachedFile = path.join(imageDir, cached);
          data = fs.readFileSync(cachedFile);
          format = (await sharp(data).metadata()).format;
          filename = cached;
        } else {
          let lastError;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const response = await (options.fetchImage || fetch)(job.sourceUrl, {
                signal: AbortSignal.timeout(25000),
              });
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              if (Number(response.headers.get('content-length')) > 25 * 1024 * 1024)
                throw new Error('Image exceeds 25 MB');
              data = Buffer.from(await response.arrayBuffer());
              if (!data.length || data.length > 25 * 1024 * 1024)
                throw new Error('Empty or oversized image');
              format = (await sharp(data).metadata()).format;
              if (!['jpeg', 'png', 'webp', 'gif', 'avif'].includes(format))
                throw new Error(`Unsupported image format: ${format}`);
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
            }
          }
          if (lastError) throw lastError;
          filename = `${stem}.${format === 'jpeg' ? 'jpg' : format}`;
          const target = path.join(imageDir, filename);
          fs.writeFileSync(target, data);
        }
        const cdnUrl = `${cdnBase}/${filename}`;
        const product = products.get(job.productId);
        product.images = JSON.stringify([cdnUrl]);
        product.updatedAt = result.report.generatedAt;
        const change = changes.get(job.productId);
        if (!change.changedFields.includes('images')) change.changedFields.push('images');
        result.report.images.downloaded.push({
          ...job,
          filename,
          cdnUrl,
          bytes: data.length,
          cached: Boolean(cached),
        });
      } catch (error) {
        result.report.images.failed.push({
          ...job,
          error: error.message,
          cause: error.cause?.message,
        });
      }
      completed++;
      if (completed % 50 === 0)
        console.log(`Images processed: ${completed}/${result.report.imageJobs.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, worker));
  result.report.summary.imagesPrepared = result.report.images.downloaded.length;
  result.report.summary.imageFailures = result.report.images.failed.length;
  result.report.summary.changedExisting = result.report.changes.filter(
    (c) => c.kind === 'existing' && c.changedFields.length,
  ).length;
}

async function main(argv = process.argv.slice(2)) {
  const args = {};
  const allowed = new Set([
    'backup',
    'source',
    'out',
    'brands',
    'tax-column',
    'image-column',
    'cdn-base',
  ]);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!allowed.has(key) || !argv[i + 1] || argv[i + 1].startsWith('--'))
      throw new Error(`Invalid option: ${argv[i]}`);
    args[key] = argv[i + 1];
  }
  const input = path.join(__dirname, 'json-outputs');
  const backup = path.resolve(args.backup || path.join(input, 'products_backup.json'));
  const source = path.resolve(args.source || path.join(input, 'all_sheets_data2.json'));
  const out = path.resolve(args.out || path.join(input, 'colston-pricing-update'));
  const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const result = reconcile(read(backup), read(source), {
    brands: args.brands?.split(',').map((s) => s.trim()),
    taxColumn: args['tax-column'],
    imageColumn: args['image-column'],
  });
  result.report.inputs = Object.fromEntries(
    [
      ['backup', backup],
      ['source', source],
    ].map(([key, file]) => [
      key,
      {
        file,
        sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
      },
    ]),
  );
  await prepareImages(result, out, { cdnBase: args['cdn-base'] });
  const files = {
    'updated_existing_products.json': result.existing,
    'new_updated.json': result.added,
    'updated_products.json': result.products,
    'needs_review.json': result.report.rejected,
    'mapping_report.json': result.report,
  };
  for (const filename of Object.keys(files)) {
    if (
      [backup, source].some(
        (inputFile) => path.resolve(out, filename).toLowerCase() === inputFile.toLowerCase(),
      )
    ) {
      throw new Error('Output would overwrite an input');
    }
  }
  fs.mkdirSync(out, { recursive: true });
  for (const [filename, data] of Object.entries(files))
    fs.writeFileSync(path.join(out, filename), JSON.stringify(data, null, 2) + '\n');
  console.log(JSON.stringify({ output: out, ...result.report.summary }, null, 2));
}
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
module.exports = { reconcile, prepareImages, BRAND_ID, KEYS };
