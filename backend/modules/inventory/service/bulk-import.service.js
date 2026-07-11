const slugify = require("slugify");
const sequelize = require("../../config/database");
const { Product, Category, Vendor, Brand, Job } = require("../../models");

function generateSlug(name) {
  return slugify(name || "", { lower: true, strict: true });
}

/**
 * Shared batch processor used both by the synchronous small-batch endpoint
 * and by the background import worker (`exports.processProductBatch`).
 *
 * NOTE: this relies on `Vendor` and `Job` models existing in `../../models`.
 * The original controller referenced both without importing them — add them
 * to your models index if they aren't already exported from there.
 */
async function processProductBatch(productsBatch, t, options = {}) {
  const { importJobId, selectedBrandId } = options;

  if (!selectedBrandId) {
    throw new Error("selectedBrandId is required for bulk import");
  }

  const created = [];
  const failed = [];
  const newCategories = new Set();
  const newVendors = new Set();

  const categoryNames = [
    ...new Set(
      productsBatch.map((p) => p.categoryName?.trim()).filter(Boolean),
    ),
  ];
  const vendorNames = [
    ...new Set(
      productsBatch
        .map((p) => p.vendorName?.trim() || "Unknown")
        .filter(Boolean),
    ),
  ];

  const [existingCategories, existingVendors, selectedBrand] =
    await Promise.all([
      Category.findAll({
        where: { name: categoryNames },
        attributes: ["id", "name", "slug"],
        transaction: t,
      }),
      Vendor.findAll({
        where: { name: vendorNames },
        attributes: ["id", "name"],
        transaction: t,
      }),
      Brand.findByPk(selectedBrandId, {
        attributes: ["id", "name"],
        transaction: t,
      }),
    ]);

  if (!selectedBrand) {
    throw new Error(`Selected brand ID ${selectedBrandId} not found`);
  }

  const categoryMap = new Map(
    existingCategories.map((c) => [c.name.trim().toLowerCase(), c]),
  );
  const vendorMap = new Map(
    existingVendors.map((v) => [v.name.trim().toLowerCase(), v]),
  );

  // ── Create missing categories & vendors ─────────────────────────
  for (const p of productsBatch) {
    const catName = p.categoryName?.trim() || "Uncategorized";
    const catKey = catName.toLowerCase();

    if (!categoryMap.has(catKey)) {
      const slug = generateSlug(catName);
      const [newCat] = await Category.findOrCreate({
        where: { name: catName },
        defaults: { name: catName, slug, brandId: selectedBrand.id },
        transaction: t,
      });
      categoryMap.set(catKey, newCat);
      newCategories.add(catName);
    }

    const venName = p.vendorName?.trim() || "Unknown";
    const venKey = venName.toLowerCase();

    if (!vendorMap.has(venKey)) {
      const [newVen] = await Vendor.findOrCreate({
        where: { name: venName },
        defaults: { name: venName },
        transaction: t,
      });
      vendorMap.set(venKey, newVen);
      newVendors.add(venName);
    }
  }

  // ── Create products ─────────────────────────────────────────────
  for (const [index, p] of productsBatch.entries()) {
    const rowIndex = p.rowIndex || index + 2;

    try {
      if (!p.name?.trim() || !p.product_code?.trim()) {
        throw new Error("Product name and code are required");
      }

      const existing = await Product.findOne({
        where: { product_code: p.product_code.trim() },
        transaction: t,
      });
      if (existing) {
        throw new Error(`Product code "${p.product_code}" already exists`);
      }

      const category = categoryMap.get(
        (p.categoryName?.trim() || "Uncategorized").toLowerCase(),
      );
      const vendor = vendorMap.get(
        (p.vendorName?.trim() || "Unknown").toLowerCase(),
      );

      const productData = {
        name: p.name.trim(),
        product_code: p.product_code.trim(),
        description: p.description?.trim() || null,
        quantity: Number(p.quantity) || 0,
        alert_quantity: p.alert_quantity ? Number(p.alert_quantity) : null,
        tax: p.tax ? Number(p.tax) : null,
        isFeatured: !!p.isFeatured,
        status: Number(p.quantity) > 0 ? "active" : "out_of_stock",
        images: Array.isArray(p.images) ? p.images : [],
        meta: p.meta || null,
        categoryId: category?.id || null,
        brandId: selectedBrand.id,
        vendorId: vendor?.id || null,
      };

      const newProduct = await Product.create(productData, { transaction: t });

      if (Array.isArray(p.keywords) && p.keywords.length > 0) {
        const { Keyword } = require("../../models");
        const keywords = p.keywords.map((k) => k.trim()).filter(Boolean);
        const keywordRecords = await Promise.all(
          keywords.map(async (kw) => {
            let record = await Keyword.findOne({
              where: { keyword: kw },
              transaction: t,
            });
            if (!record) {
              record = await Keyword.create(
                { keyword: kw },
                { transaction: t },
              );
            }
            return record;
          }),
        );

        await newProduct.setKeywords(
          keywordRecords.map((k) => k.id),
          { transaction: t },
        );
      }

      created.push({
        rowIndex,
        productId: newProduct.id,
        name: newProduct.name,
        product_code: newProduct.product_code,
      });
    } catch (err) {
      failed.push({
        rowIndex,
        product_code: p.product_code || "[missing]",
        name: p.name || "[missing]",
        error: err.message || "Unknown error",
      });
    }
  }

  // ── Update background-job progress, if tracked ──────────────────
  if (importJobId) {
    const job = await Job.findByPk(importJobId, { transaction: t });
    if (job) {
      await job.update(
        {
          progress: {
            ...job.progress,
            processedRows:
              (job.progress?.processedRows || 0) + productsBatch.length,
            successCount: (job.progress?.successCount || 0) + created.length,
            failedCount: (job.progress?.failedCount || 0) + failed.length,
          },
          results: {
            ...job.results,
            newCategoriesCount:
              (job.results?.newCategoriesCount || 0) + newCategories.size,
            newVendorsCount:
              (job.results?.newVendorsCount || 0) + newVendors.size,
          },
          errorLog: [
            ...(job.errorLog || []),
            ...failed.map((f) => ({
              timestamp: new Date().toISOString(),
              row: f.rowIndex,
              message: f.error,
              data: { product_code: f.product_code, name: f.name },
            })),
          ],
        },
        { transaction: t },
      );
    }
  }

  return {
    created,
    failed,
    newCategories: newCategories.size,
    newBrands: 0,
    newVendors: newVendors.size,
  };
}

/** Small-batch endpoint (<=300 rows), runs synchronously in a single transaction. */
async function bulkImportProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    const err = new Error("products must be a non-empty array");
    err.status = 400;
    throw err;
  }

  if (products.length > 300) {
    const err = new Error(
      "Maximum 300 products per request (use chunking or background import)",
    );
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();

  try {
    const result = await processProductBatch(products, t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

/** Simpler batch creator for a fixed categoryId/brandId/vendorId shared across all rows. */
async function batchCreateProducts({
  categoryId,
  brandId,
  vendorId,
  brand_parentcategoriesId,
  products,
}) {
  if (
    !Array.isArray(products) ||
    products.length === 0 ||
    products.length > 50
  ) {
    const err = new Error("Send 1–50 products");
    err.status = 400;
    throw err;
  }

  if (!categoryId || !brandId) {
    const err = new Error("categoryId and brandId required");
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  const results = [];
  const errors = [];

  try {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const index = i + 1;

      if (!p.name?.trim() || !p.product_code?.trim()) {
        errors.push(`Row ${index}: Name and Code required`);
        continue;
      }

      try {
        const product = await Product.create(
          {
            name: p.name.trim(),
            product_code: p.product_code.trim(),
            quantity: parseInt(p.quantity) || 0,
            price: parseFloat(p.price) || 0,
            categoryId,
            brandId,
            vendorId: vendorId || null,
            brand_parentcategoriesId: brand_parentcategoriesId || null,
            description: p.description?.trim() || null,
            meta: p.meta && Object.keys(p.meta).length ? p.meta : null,
            images: "[]",
            status: "active",
            isFeatured: false,
          },
          { transaction: t },
        );

        results.push({
          row: index,
          productId: product.productId,
          name: product.name,
          product_code: product.product_code,
          status: "success",
        });
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          errors.push(`Row ${index}: Code ${p.product_code} already exists`);
        } else {
          errors.push(`Row ${index}: ${err.message}`);
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      await t.rollback();
      const err = new Error("All failed");
      err.status = 400;
      err.errors = errors;
      throw err;
    }

    if (results.length > 0) {
      await t.commit();
    } else {
      await t.rollback();
    }

    return { created: results, errors };
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
}

module.exports = {
  processProductBatch,
  bulkImportProducts,
  batchCreateProducts,
};
