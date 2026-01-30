// workers/jobProcessor.js
// Run this as a separate process (e.g. node workers/jobProcessor.js or via pm2)

const { Worker } = require("bullmq");
const path = require("path");
const fs = require("fs").promises;
const Papa = require("papaparse");
const XLSX = require("xlsx");

// Sequelize & all models used in bulk import
const sequelize = require("../config/database");
const { Job, Product, Category, Brand, Vendor, Keyword } = require("../models");

// FTP helper
const { downloadFromFtp } = require("../middleware/upload");

// Redis connection
const IORedis = require("ioredis");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  family: 4,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 5000),
});

connection.on("connect", () => console.log("[Redis Worker] Socket connected"));
connection.on("ready", () => console.log("[Redis Worker] Ready"));
connection.on("error", (err) =>
  console.error("[Redis Worker] Error:", err.message),
);
connection.on("reconnecting", (delay) =>
  console.log(`[Redis Worker] Reconnecting in ${delay}ms`),
);

// Simple slugify
function generateSlug(name) {
  if (!name) return "unnamed";
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Worker
const worker = new Worker(
  "jobs",
  async (bullJob) => {
    const { jobId } = bullJob.data;

    console.log(
      `[Worker ${bullJob.id}] Processing job ID: ${jobId} (attempt ${bullJob.attemptsMade + 1})`,
    );

    const job = await Job.findByPk(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (job.status === "cancelled") {
      console.log(`[Worker ${bullJob.id}] Job ${jobId} cancelled → skipping`);
      return { status: "cancelled" };
    }

    await job.update({ status: "processing", updatedAt: new Date() });

    try {
      if (job.type === "bulk-import") {
        await processBulkImport(job, bullJob);
      } else {
        throw new Error(`Unsupported job type: ${job.type}`);
      }

      await job.update({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`[Worker ${bullJob.id}] Job ${jobId} → COMPLETED`);
      return { status: "completed" };
    } catch (err) {
      console.error(
        `[Worker ${bullJob.id}] Job ${jobId} failed: ${err.message}`,
      );

      const logEntry = {
        timestamp: new Date().toISOString(),
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      };

      await job.update({
        status: "failed",
        errorLog: [...(job.errorLog || []), logEntry],
        updatedAt: new Date(),
      });

      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
    autorun: true,
    stalledInterval: 30000,
    maxStalledCount: 2,
  },
);

// ───────────────────────────────────────────────
//   BULK IMPORT PROCESSOR
// ───────────────────────────────────────────────

async function processBulkImport(job, bullJob) {
  const { filePath, originalFileName, mapping, selectedBrandId } =
    job.params || {};

  if (!filePath || !originalFileName) {
    throw new Error("Missing filePath or originalFileName in job params");
  }
  if (!selectedBrandId) {
    throw new Error("Bulk import requires selectedBrandId");
  }

  const tempDir = path.join(__dirname, "..", "temp");
  const tempFile = path.join(
    tempDir,
    `${job.id}-${Date.now()}-${originalFileName}`,
  );

  let t = null;

  try {
    await fs.mkdir(tempDir, { recursive: true });

    console.log(`[Worker] Downloading ${filePath} → ${tempFile}`);
    const fileBuffer = await downloadFromFtp(filePath);
    await fs.writeFile(tempFile, fileBuffer);

    // ── Parse file ───────────────────────────────────────────────────────
    let rows = [],
      headers = [];
    const lowerName = originalFileName.toLowerCase();

    if (lowerName.endsWith(".csv")) {
      const text = await fs.readFile(tempFile, "utf-8");
      const parsed = Papa.parse(text, { skipEmptyLines: true, header: false });
      if (parsed.errors.length) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      headers = parsed.data[0] || [];
      rows = parsed.data.slice(1);
    } else {
      const workbook = XLSX.readFile(tempFile);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
      });
      headers = json[0] || [];
      rows = json.slice(1);
    }

    console.log(
      `[Worker] File parsed → ${rows.length} rows, ${headers.length} columns`,
    );

    // ── Debug: log headers and first row ────────────────────────────────
    console.log(`[DEBUG] Headers:`, headers);
    if (rows.length > 0) {
      console.log(
        `[DEBUG] First data row (first 8 cells):`,
        rows[0].slice(0, 8),
      );
    }

    await job.update({
      progress: {
        totalRows: rows.length,
        processedRows: 0,
        successCount: 0,
        failedCount: 0,
      },
      results: { newCategoriesCount: 0, newBrandsCount: 0, newVendorsCount: 0 },
      updatedAt: new Date(),
    });

    // ── Build field → column index map ──────────────────────────────────
    const fieldToCol = {};
    Object.entries(mapping || {}).forEach(([idxStr, field]) => {
      const idx = Number(idxStr);
      if (!isNaN(idx) && field) {
        fieldToCol[field] = idx;
      }
    });

    // ── Debug mapping ───────────────────────────────────────────────────
    console.log(
      `[DEBUG] Raw mapping from frontend:`,
      JSON.stringify(mapping, null, 2),
    );
    console.log(`[DEBUG] Parsed fieldToCol:`, fieldToCol);

    // Required fields — warn instead of throw during debug phase
    const missingRequired = [];
    if (!fieldToCol.name) missingRequired.push("name");
    if (!fieldToCol.product_code) missingRequired.push("product_code");

    if (missingRequired.length > 0) {
      console.warn(
        `[WARNING] Missing required mappings: ${missingRequired.join(", ")} — using fallback to columns 0 & 1`,
      );
    }

    // Validate brand
    const selectedBrand = await Brand.findByPk(selectedBrandId);
    if (!selectedBrand) throw new Error(`Brand ${selectedBrandId} not found`);

    const BATCH_SIZE = 200;
    let totalSuccess = 0,
      totalFailed = 0,
      totalNewCat = 0,
      totalNewVendor = 0;

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      await job.reload({ plain: true });
      if (job.status === "cancelled")
        throw new Error("Processing cancelled by user");

      const end = Math.min(start + BATCH_SIZE, rows.length);
      const batchRows = rows.slice(start, end);

      t = await sequelize.transaction();

      try {
        const batchProducts = batchRows.map((row, idx) => {
          const data = {};
          const meta = {};

          // ── Apply mapping ──
          Object.entries(mapping || {}).forEach(([colIdxStr, fieldName]) => {
            const col = Number(colIdxStr);
            if (isNaN(col) || !fieldName || typeof fieldName !== "string")
              return;

            const rawValue = row[col];
            if (rawValue == null) return;
            const value = String(rawValue).trim();
            if (!value) return;

            if (fieldName.startsWith("meta_")) {
              const uuid = fieldName.replace(/^meta_/, "");
              if (
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                  uuid,
                )
              ) {
                meta[uuid] = value;
              }
            } else {
              data[fieldName] = value;
            }
          });

          // Fallbacks (only if still missing)
          if (!data.name && row[0] != null) {
            data.name = String(row[0]).trim();
          }
          if (!data.product_code && row[1] != null) {
            data.product_code = String(row[1]).trim();
          }
          return {
            rowIndex: start + idx + 2,
            name: data.name,
            product_code: data.product_code,
            description: data.description,
            quantity: data.quantity,
            alert_quantity: data.alert_quantity,
            tax: data.tax,
            isFeatured:
              data.isFeatured === "true" ||
              data.isFeatured === true ||
              !!data.isFeatured,
            keywords: (data.keywords || "")
              .split(/[,;]\s*/)
              .map((k) => k.trim())
              .filter(Boolean),
            images: (data.images || "")
              .split(/[,;]\s*/)
              .map((url) => url.trim())
              .filter(Boolean),
            meta_barcode: data.meta_barcode,
            meta_sellingPrice: data.meta_sellingPrice,
            meta_mrp: data.meta_mrp,
            meta_purchasePrice: data.meta_purchasePrice,
            categoryName: data.category,
            vendorName: data.vendor,
            meta, // UUID-keyed meta object
          };
        });

        const batchResult = await processProductBatch(batchProducts, t, {
          importJobId: job.id,
          selectedBrandId,
        });

        await t.commit();

        totalSuccess += batchResult.created.length;
        totalFailed += batchResult.failed.length;
        totalNewCat += batchResult.newCategories;
        totalNewVendor += batchResult.newVendors;

        await job.update({
          progress: {
            totalRows: rows.length,
            processedRows: end,
            successCount: totalSuccess,
            failedCount: totalFailed,
          },
          results: {
            newCategoriesCount: totalNewCat,
            newBrandsCount: 0,
            newVendorsCount: totalNewVendor,
          },
          updatedAt: new Date(),
        });

        console.log(
          `[Worker ${bullJob.id}] Batch ${start + 1}-${end}/${rows.length} → ` +
            `Success: ${batchResult.created.length}, Failed: ${batchResult.failed.length}`,
        );
      } catch (batchErr) {
        if (t && !t.finished) await t.rollback();
        console.error(
          `[Worker ${bullJob.id}] Batch failed:`,
          batchErr.message,
          batchErr.stack,
        );

        await job.update({
          errorLog: [
            ...(job.errorLog || []),
            {
              timestamp: new Date().toISOString(),
              message: `Batch ${start + 1}-${end} failed: ${batchErr.message}`,
              rowsAffected: batchRows.length,
            },
          ],
          updatedAt: new Date(),
        });

        throw batchErr;
      }
    }

    // Final job status update
    await job.update({
      progress: {
        totalRows: rows.length,
        processedRows: rows.length,
        successCount: totalSuccess,
        failedCount: totalFailed,
      },
      results: {
        newCategoriesCount: totalNewCat,
        newBrandsCount: 0,
        newVendorsCount: totalNewVendor,
      },
      updatedAt: new Date(),
    });
  } catch (err) {
    if (t && !t.finished) await t.rollback();
    throw err;
  } finally {
    try {
      await fs.unlink(tempFile);
      console.log(`[Worker] Removed temp file: ${tempFile}`);
    } catch (e) {
      if (e.code !== "ENOENT")
        console.warn("[Worker] Temp file cleanup failed", e);
    }
  }
}

// ───────────────────────────────────────────────
//   BULK IMPORT BATCH PROCESSOR (embedded here)
// ───────────────────────────────────────────────
async function processProductBatch(productsBatch, t, options = {}) {
  const { importJobId, selectedBrandId } = options;

  if (!selectedBrandId) throw new Error("selectedBrandId is required");

  const created = [];
  const failed = [];
  const newCategories = new Set();
  const newVendors = new Set();

  // 1. Pre-fetch existing entities
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
        attributes: ["categoryId", "name", "slug"],
        transaction: t,
      }),
      Vendor.findAll({
        where: { vendorName: vendorNames },
        attributes: ["id", "vendorName"],
        transaction: t,
      }),
      Brand.findByPk(selectedBrandId, {
        attributes: ["id", "brandName"], // or "brandName" if that's the column
        transaction: t,
      }),
    ]);

  if (!selectedBrand) throw new Error(`Brand ${selectedBrandId} not found`);

  const categoryMap = new Map(
    existingCategories.map((c) => [c.name.trim().toLowerCase(), c]),
  );

  const vendorMap = new Map(
    existingVendors.map((v) => [v.vendorName.trim().toLowerCase(), v]),
  );

  // 2. Create missing categories & vendors
  for (const p of productsBatch) {
    // Category (unchanged)
    const catName = p.categoryName?.trim() || "Uncategorized";
    const catKey = catName.toLowerCase();

    if (!categoryMap.has(catKey)) {
      const slug = generateSlug(catName);
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

    // Vendor — generate vendorId
    const venName = p.vendorName?.trim() || "Unknown";
    const venKey = venName.toLowerCase();

    if (!vendorMap.has(venKey)) {
      const generatedVendorId = `V_${Date.now().toString().slice(-6)}`; // simple unique

      const [newVen] = await Vendor.findOrCreate({
        where: { vendorName: venName },
        defaults: {
          vendorId: generatedVendorId, // ← required field
          vendorName: venName,
          // brandId: selectedBrand.id,         // optional
        },
        transaction: t,
      });

      vendorMap.set(venKey, newVen);
      newVendors.add(venName);
    }
  }

  // 3. Create products (unchanged)
  for (const [index, p] of productsBatch.entries()) {
    const rowIndex = p.rowIndex || index + 2;

    try {
      if (!p.name?.trim() || !p.product_code?.trim()) {
        throw new Error("Product name and code required");
      }

      const existing = await Product.findOne({
        where: { product_code: p.product_code.trim() },
        transaction: t,
      });
      if (existing)
        throw new Error(`Product code "${p.product_code}" already exists`);

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
        categoryId: category?.categoryId || null,
        brandId: selectedBrand.id,
        vendorId: vendor?.id || null,
      };

      const newProduct = await Product.create(productData, { transaction: t });

      // Keywords
      if (Array.isArray(p.keywords) && p.keywords.length > 0) {
        const keywords = p.keywords.map((k) => k.trim()).filter(Boolean);
        const keywordRecords = await Promise.all(
          keywords.map(async (kw) => {
            let record = await Keyword.findOne({
              where: { keyword: kw },
              transaction: t,
            });
            if (!record)
              record = await Keyword.create(
                { keyword: kw },
                { transaction: t },
              );
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
        productId: newProduct.productId,
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

  // 4. Update job progress
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

// Worker events & shutdown (unchanged from your last version)
worker.on("completed", (job) => {
  console.log(
    `[Worker] Completed → Job ID ${job.data.jobId} (BullMQ ID ${job.id})`,
  );
});

worker.on("failed", (job, err) => {
  console.error(
    `[Worker] FAILED → Job ID ${job?.data?.jobId} (BullMQ ID ${job.id}): ${err.message}`,
  );
});

worker.on("stalled", (jobId) => {
  console.warn(`[Worker] STALLED job detected: ${jobId}`);
});

const shutdown = async (sig) => {
  console.log(`[Worker] Received ${sig} → closing...`);
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log('[Worker] Started – listening on queue "jobs"');
