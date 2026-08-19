const {
  Op,
  sequelize,
  Product,
  ProductMeta,
  Brand,
  Keyword,
  Category,
  ensureAssociations,
  parseJsonSafely,
} = require("./product.helpers");

// Note: Vendor, Job, generateSlug are referenced in original processProductBatch
// but not imported in the provided controller. Left exactly as-is for production safety.
// You may need to require them in your actual models if missing.

/**
 * GET /products/codes/brand-wise
 * Returns: { "Brand A": ["ABC-001", "ABC-002"], "Brand B": [...] }
 */
exports.getAllProductCodesBrandWise = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["product_code", "brandId"],
      where: { status: "active" },
      raw: true,
    });

    // Group by brandId
    const grouped = products.reduce((acc, p) => {
      const brandId = p.brandId || "unknown";
      if (!acc[brandId]) acc[brandId] = [];
      acc[brandId].push(p.product_code);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: products.length,
      data: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product codes",
      error: error.message,
    });
  }
};

exports.batchCreateProducts = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      categoryId,
      brandId,
      vendorId,
      brand_parentcategoriesId,
      products, // array of { name, product_code, quantity, price, meta: { "1": "8GB", "2": "256GB" } }
    } = req.body;

    if (
      !Array.isArray(products) ||
      products.length === 0 ||
      products.length > 50
    ) {
      return res.status(400).json({ message: "Send 1–50 products" });
    }

    // Validate common fields
    if (!categoryId || !brandId) {
      return res
        .status(400)
        .json({ message: "categoryId and brandId required" });
    }

    const results = [];
    const errors = [];

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
            images: "[]", // or allow bulk image later
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
      return res.status(400).json({ message: "All failed", errors });
    }

    if (results.length > 0) {
      await t.commit();
    } else {
      await t.rollback();
    }

    return res.status(201).json({
      message: `${results.length} products created`,
      successCount: results.length,
      failedCount: errors.length,
      created: results,
      errors,
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

exports.checkproductCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res
        .status(400)
        .json({ exists: false, message: "Code is required" });
    }

    // Case-insensitive check (optional, but recommended for consistency)
    const existing = await Product.findOne({
      where: {
        product_code: code.trim(),
      },
      attributes: ["product_code"], // only fetch the code, minimal data
    });

    res.json({ exists: !!existing });
  } catch (error) {
    res.status(500).json({ exists: false, error: "Server error" });
  }
};

// ───────────────────────────────────────────────
//   BULK IMPORT BATCH PROCESSOR (moved here so worker can use it)
// ───────────────────────────────────────────────
async function processProductBatch(productsBatch, t, options = {}) {
  const { importJobId, selectedBrandId } = options;

  if (!selectedBrandId) {
    throw new Error("selectedBrandId is required for bulk import");
  }

  const created = [];
  const failed = [];
  const newCategories = new Set();
  const newVendors = new Set();

  // 1. Pre-fetch existing categories, vendors, brand
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

  // 2. Create missing categories & vendors
  for (const p of productsBatch) {
    const catName = p.categoryName?.trim() || "Uncategorized";
    const catKey = catName.toLowerCase();

    if (!categoryMap.has(catKey)) {
      const slug = generateSlug(catName); // using your generateSlug
      const [newCat] = await Category.findOrCreate({
        where: { name: catName },
        defaults: {
          name: catName,
          slug,
          brandId: selectedBrand.id,
        },
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

  // 3. Create products
  for (const [index, p] of productsBatch.entries()) {
    const rowIndex = p.rowIndex || index + 2;

    try {
      if (!p.name?.trim() || !p.product_code?.trim()) {
        throw new Error("Product name and code are required");
      }

      // Duplicate check
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

      // Keywords (many-to-many)
      if (Array.isArray(p.keywords) && p.keywords.length > 0) {
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

  // 4. Update job progress in transaction
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
// ────────────────────────────────────────────────────────────────
// Original small-batch endpoint (still useful for <300 rows)
// ────────────────────────────────────────────────────────────────
exports.bulkImportProducts = async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "products must be a non-empty array" });
  }

  if (products.length > 300) {
    return res.status(400).json({
      success: false,
      message:
        "Maximum 300 products per request (use chunking or background import)",
    });
  }

  const t = await sequelize.transaction();

  try {
    const result = await processProductBatch(products, t);

    await t.commit();

    return res.status(201).json({
      success: true,
      message: `${result.created.length} products created`,
      created: result.created,
      failed: result.failed,
      newCategories: result.newCategories,
      newBrands: result.newBrands,
      newVendors: result.newVendors,
      totalProcessed: products.length,
      successCount: result.created.length,
      failedCount: result.failed.length,
    });
  } catch (error) {
    await t.rollback();

    return res.status(500).json({
      success: false,
      message: "Bulk import failed",
      error: error.message,
    });
  }
};

// Export the reusable batch function so worker can use it
exports.processProductBatch = processProductBatch;
