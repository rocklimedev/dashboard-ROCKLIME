const { Op } = require('sequelize');
const slugify = require('slugify');
const { v4: uuid } = require('uuid');
const COMPANY = 'd11da9f9-3f2e-4536-8236-9671200cca4a';
const PRICE = '9ba862ef-f993-4873-95ef-1fef10036aa5';
const clean = (v) => String(v ?? '').trim();
const slug = (v) => slugify(v, { lower: true, strict: true });
const fail = (message) => Object.assign(new Error(message), { status: 400 });
const numeric = (value) =>
  Number(
    clean(value)
      .replace(/^(?:INR|Rs\.?|₹)\s*/i, '')
      .replace(/,/g, ''),
  );

function validatePayload(body) {
  if (!body || !Array.isArray(body.rows) || !body.rows.length || body.rows.length > 1000)
    throw fail('Select 1–1000 product rows per import.');
  if (
    !body.brandId &&
    (!clean(body.brandName) || clean(body.brandName).length > 100 || !slug(clean(body.brandName)))
  )
    throw fail('Enter a valid brand name (up to 100 characters).');
  const codes = new Set();
  const errors = [];
  const rows = body.rows.map((raw, index) => {
    const row = {
      ...raw,
      name: clean(raw.name),
      product_code: clean(raw.product_code),
      category: clean(raw.category),
      parentCategory: clean(raw.parentCategory),
      description: clean(raw.description),
      companyCode: clean(raw.companyCode),
      quantity: !clean(raw.quantity) ? 0 : numeric(raw.quantity),
      sellingPrice: !clean(raw.sellingPrice) ? null : numeric(raw.sellingPrice),
      tax: !clean(raw.tax) ? 0 : numeric(raw.tax),
      images: clean(raw.images)
        .split(/[\n,;]+/)
        .map(clean)
        .filter(Boolean),
      keywords: clean(raw.keywords)
        .split(/[,;]+/)
        .map((s) => clean(s).toLowerCase())
        .filter(Boolean),
      extended: raw.extended || {},
      sourceRow: raw.sourceRow || index + 2,
    };
    const issues = [];
    if (!row.name || row.name.length > 255)
      issues.push('Product name is required (max 255 characters)');
    if (!row.product_code || row.product_code.length > 255)
      issues.push('Product code is required (max 255 characters)');
    if (codes.has(row.product_code.toLowerCase()))
      issues.push('Duplicate product code in selected rows');
    codes.add(row.product_code.toLowerCase());
    if (!Number.isSafeInteger(row.quantity) || row.quantity < 0 || row.quantity > 2147483647)
      issues.push('Quantity must be a non-negative integer');
    if (row.sellingPrice !== null && (!Number.isFinite(row.sellingPrice) || row.sellingPrice < 0))
      issues.push('Selling price must be non-negative');
    if (!Number.isFinite(row.tax) || row.tax < 0 || row.tax > 100)
      issues.push('Tax must be between 0 and 100');
    if (
      row.category.length > 100 ||
      row.parentCategory.length > 100 ||
      (row.parentCategory && row.parentCategory.length < 2)
    )
      issues.push('Category names must be 2–100 characters');
    if (row.parentCategory && !row.category) issues.push('A parent category requires a category');
    if (row.keywords.some((k) => k.length > 100))
      issues.push('Keywords must be at most 100 characters');
    if (row.images.some((url) => !/^https?:\/\/\S+$/i.test(url)))
      issues.push('Images must be HTTP(S) URLs separated by commas');
    if (issues.length) errors.push({ row: row.sourceRow, messages: issues });
    return row;
  });
  const fields = Array.isArray(body.fields) ? body.fields : [];
  if (fields.length > 100) throw fail('Use at most 100 extended fields.');
  const titles = new Set();
  for (const f of fields) {
    if (
      !clean(f.title) ||
      clean(f.title).length > 255 ||
      !slug(clean(f.title)) ||
      !['string', 'number'].includes(f.fieldType)
    )
      throw fail('Extended fields need a title and string/number type.');
    const key = slug(clean(f.title));
    if (titles.has(key)) throw fail('Extended field titles must be unique.');
    titles.add(key);
    rows.forEach((row) => {
      const value = row.extended[f.key];
      if (f.fieldType === 'number' && clean(value) && !Number.isFinite(numeric(value)))
        errors.push({
          row: row.sourceRow,
          messages: [`${f.title} must be numeric`],
        });
    });
  }
  const parents = new Map();
  rows.forEach((row) => {
    if (!row.category) return;
    const key = row.category.toLowerCase();
    if (parents.has(key) && parents.get(key) !== row.parentCategory.toLowerCase())
      errors.push({
        row: row.sourceRow,
        messages: ['The same category has different parent categories'],
      });
    parents.set(key, row.parentCategory.toLowerCase());
  });
  return { rows, fields, errors };
}

function createService(models) {
  const {
    sequelize,
    Brand,
    Product,
    ProductMeta,
    Category,
    ParentCategory,
    Keyword,
    ProductKeyword,
    InventoryHistory,
  } = models;
  async function prepare(body, transaction) {
    const plan = validatePayload(body);
    const options = transaction ? { transaction } : {};
    const brand = body.brandId ? await Brand.findByPk(body.brandId, options) : null;
    if (body.brandId && !brand) throw fail('Brand not found.');
    if (
      !body.brandId &&
      (await Brand.findOne({
        where: {
          [Op.or]: [
            { brandName: clean(body.brandName) },
            { brandSlug: slug(clean(body.brandName)) },
          ],
        },
        ...options,
      }))
    )
      throw fail('This brand already exists. Select it instead.');
    const existing = await Product.findAll({
      where: {
        product_code: { [Op.in]: plan.rows.map((r) => r.product_code) },
      },
      attributes: ['product_code'],
      ...options,
    });
    const existingCodes = new Set(existing.map((p) => p.product_code.toLowerCase()));
    plan.rows.forEach((r) => {
      if (existingCodes.has(r.product_code.toLowerCase()))
        plan.errors.push({
          row: r.sourceRow,
          messages: ['Product code already exists; this workspace only creates new products'],
        });
    });
    const definitions = await ProductMeta.findAll(options);
    for (const f of plan.fields) {
      f.definition = f.metaId
        ? definitions.find((d) => d.id === f.metaId)
        : definitions.find((d) => slug(d.title) === slug(f.title) || d.slug === slug(f.title));
      if (f.metaId && !f.definition) throw fail(`Metadata field ${f.title} no longer exists.`);
      if (
        f.definition &&
        f.definition.fieldType !== f.fieldType &&
        !['mm', 'inch', 'pcs', 'box', 'feet'].includes(f.definition.fieldType)
      )
        throw fail(`Field type does not match ${f.title}.`);
    }
    const categories = brand
      ? await Category.findAll({ where: { brandId: brand.id }, ...options })
      : [];
    for (const row of plan.rows) {
      const existingCategory = categories.find(
        (c) => c.name.toLowerCase() === row.category.toLowerCase(),
      );
      if (existingCategory && row.parentCategory) {
        const parent = existingCategory.parentCategoryId
          ? await ParentCategory.findByPk(existingCategory.parentCategoryId, options)
          : null;
        if (parent?.name.toLowerCase() !== row.parentCategory.toLowerCase())
          plan.errors.push({
            row: row.sourceRow,
            messages: ['Existing category has a different parent category'],
          });
      }
    }
    return {
      ...plan,
      brand,
      categories,
      summary: {
        products: plan.rows.length,
        categories: [...new Set(plan.rows.map((r) => r.category).filter(Boolean))],
        parentCategories: [...new Set(plan.rows.map((r) => r.parentCategory).filter(Boolean))],
        extendedFields: plan.fields.map((f) => ({
          title: f.title,
          action: f.definition ? 'Reuse' : 'Create',
        })),
      },
    };
  }
  return {
    preview: async (body) => {
      const plan = await prepare(body);
      return { errors: plan.errors, summary: plan.summary };
    },
    commit: async (body, userId) =>
      sequelize.transaction(async (transaction) => {
        const plan = await prepare(body, transaction);
        if (plan.errors.length) throw fail('Resolve all review errors before importing.');
        const options = { transaction };
        const brand =
          plan.brand ||
          (await Brand.create(
            {
              brandName: clean(body.brandName),
              brandSlug: slug(clean(body.brandName)),
            },
            options,
          ));
        const fieldIds = new Map();
        for (const f of plan.fields) {
          const definition =
            f.definition ||
            (await ProductMeta.create(
              {
                title: clean(f.title),
                slug: slug(f.title),
                fieldType: f.fieldType,
              },
              options,
            ));
          fieldIds.set(f.key, definition.id);
        }
        const categoryMap = new Map(plan.categories.map((c) => [c.name.toLowerCase(), c]));
        const keywordMap = new Map();
        for (const row of plan.rows) {
          let category = categoryMap.get(row.category.toLowerCase());
          if (row.category && !category) {
            const parent = row.parentCategory
              ? (
                  await ParentCategory.findOrCreate({
                    where: { name: row.parentCategory },
                    defaults: {
                      name: row.parentCategory,
                      slug: `${slug(row.parentCategory)}-${uuid().slice(0, 8)}`,
                    },
                    ...options,
                  })
                )[0]
              : null;
            category = await Category.create(
              {
                name: row.category,
                slug: `${slug(brand.brandName)}-${slug(row.category)}-${uuid().slice(0, 8)}`,
                brandId: brand.id,
                parentCategoryId: parent?.id || null,
              },
              options,
            );
            categoryMap.set(row.category.toLowerCase(), category);
          }
          const meta = {};
          for (const f of plan.fields)
            if (clean(row.extended[f.key]))
              meta[fieldIds.get(f.key)] =
                f.fieldType === 'number'
                  ? numeric(row.extended[f.key])
                  : clean(row.extended[f.key]);
          if (row.companyCode) meta[COMPANY] = row.companyCode;
          if (row.sellingPrice !== null) meta[PRICE] = row.sellingPrice;
          const product = await Product.create(
            {
              name: row.name,
              product_code: row.product_code,
              brandId: brand.id,
              categoryId: category?.categoryId || null,
              description: row.description,
              quantity: row.quantity,
              tax: row.tax,
              images: JSON.stringify(row.images),
              meta,
              status: 'active',
            },
            options,
          );
          const keywords = [
            ...new Set([
              ...row.keywords,
              ...(category
                ? [`${brand.brandName} ${category.name}`.toLowerCase().slice(0, 100)]
                : []),
            ]),
          ];
          for (const text of keywords) {
            let keyword = keywordMap.get(text);
            if (!keyword) {
              keyword = (
                await Keyword.findOrCreate({
                  where: { keyword: text },
                  defaults: {
                    keyword: text,
                    categoryId: category?.categoryId || null,
                  },
                  ...options,
                })
              )[0];
              keywordMap.set(text, keyword);
            }
            await ProductKeyword.create(
              { productId: product.productId, keywordId: keyword.id },
              options,
            );
          }
          if (row.quantity)
            await InventoryHistory.create(
              {
                productId: product.productId,
                change: row.quantity,
                quantityAfter: row.quantity,
                action: 'add-stock',
                userId,
                message: 'Initial stock from brand onboarding',
              },
              options,
            );
        }
        return {
          brandId: brand.id,
          brandName: brand.brandName,
          ...plan.summary,
        };
      }),
  };
}
module.exports = { validatePayload, createService };
