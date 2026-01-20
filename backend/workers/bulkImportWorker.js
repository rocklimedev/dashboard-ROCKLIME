// workers/bulkImportWorker.js
const { Worker } = require("bullmq");
const { connection } = require("../lib/queue");
const { ImportJob } = require("../models");
const Papa = require("papaparse");
const XLSX = require("xlsx");
const { downloadFromFtp } = require("../middleware/upload");
const { sequelize } = require("../config/database");
const productController = require("../controller/productController");
const { Op } = require("sequelize");
const { Keyword } = require("../models");

console.log("[Worker] Starting bulk-product-import worker...");

const worker = new Worker(
  "bulk-product-import",
  async (job) => {
    const { importJobId } = job.data;

    console.log(`[Job ${job.id}] Processing import job: ${importJobId}`);

    const importJob = await ImportJob.findByPk(importJobId);
    if (!importJob) {
      throw new Error(`ImportJob not found: ${importJobId}`);
    }

    await importJob.update({ status: "processing" });

    let fileBuffer;
    try {
      console.log(
        `[Job ${job.id}] Downloading file from FTP: ${importJob.filePath}`,
      );
      fileBuffer = await downloadFromFtp(importJob.filePath);
    } catch (err) {
      console.error(`[Job ${job.id}] FTP download failed:`, err);
      await importJob.update({
        status: "failed",
        errorLog: [{ error: `Failed to download file: ${err.message}` }],
      });
      throw err;
    }

    // ────────────────────────────────────────────────
    // Parse file (CSV or Excel)
    // ────────────────────────────────────────────────
    let headers = [];
    let rows = [];

    try {
      if (importJob.originalFileName?.toLowerCase().endsWith(".csv")) {
        const text = fileBuffer.toString("utf-8");
        const parsed = Papa.parse(text, {
          skipEmptyLines: true,
          header: false,
          trimHeaders: false,
        });
        if (parsed.errors.length > 0) {
          throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
        }
        headers = parsed.data[0] || [];
        rows = parsed.data
          .slice(1)
          .filter((r) => r.some((cell) => cell?.toString().trim()));
      } else {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
        });
        headers = json[0] || [];
        rows = json.slice(1).filter((r) => r.some((cell) => cell));
      }

      console.log(`[Job ${job.id}] Parsed ${rows.length} rows`);

      if (rows.length === 0) {
        throw new Error("No data rows found in file");
      }

      await importJob.update({ totalRows: rows.length });
    } catch (parseErr) {
      console.error(`[Job ${job.id}] File parse failed:`, parseErr);
      await importJob.update({
        status: "failed",
        errorLog: [{ error: `File parsing failed: ${parseErr.message}` }],
      });
      throw parseErr;
    }

    // ────────────────────────────────────────────────
    // Process in batches
    // ────────────────────────────────────────────────
    const BATCH_SIZE = 200;
    let successCount = 0;
    let failedRows = importJob.errorLog || [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batchRows = rows.slice(i, i + BATCH_SIZE);

      // Convert raw row arrays → product objects using mapping
      const batchProducts = batchRows.map((row, batchIdx) => {
        const product = {
          rowIndex: i + batchIdx + 2,
        };

        // Apply mapping (colIndex → field name)
        Object.entries(importJob.mapping).forEach(([colIndexStr, field]) => {
          const colIndex = parseInt(colIndexStr, 10);
          if (isNaN(colIndex) || colIndex >= row.length) return;

          let value = row[colIndex]?.toString().trim() || "";

          if (!value) return;

          if (field === "name") product.name = value;
          else if (field === "product_code") product.product_code = value;
          else if (field === "description") product.description = value;
          else if (field === "quantity")
            product.quantity = parseFloat(value) || 0;
          else if (field === "alert_quantity")
            product.alert_quantity = parseFloat(value) || null;
          else if (field === "tax") product.tax = parseFloat(value) || null;
          else if (field === "status") product.status = value;
          else if (field === "isFeatured")
            product.isFeatured = ["true", "1", "yes"].includes(
              value.toLowerCase(),
            );
          else if (field === "category") product.categoryName = value;
          else if (field === "brand") product.brandName = value;
          else if (field === "vendor") product.vendorName = value;
          else if (field === "images") {
            product.images = value
              .split(",")
              .map((u) => u.trim())
              .filter((u) => u && /^https?:\/\//i.test(u));
          } else if (field === "keywords") {
            product.keywords = value
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);
          } else if (field.startsWith("meta_")) {
            product.meta = product.meta || {};
            const metaKey = field.replace("meta_", "");
            product.meta[metaKey] = isNaN(parseFloat(value))
              ? value
              : parseFloat(value);
          }
        });

        return product;
      });

      const t = await sequelize.transaction();
      try {
        const batchResult = await productController.processProductBatch(
          batchProducts,
          t,
          importJobId, // ← tells the helper to update ImportJob live
        );

        successCount += batchResult.created.length;
        failedRows = [...failedRows, ...batchResult.failed];

        await importJob.update(
          {
            processedRows: Math.min(
              importJob.processedRows + batchRows.length,
              importJob.totalRows,
            ),
            successCount,
            failedCount: failedRows.length,
            errorLog: failedRows,
            newCategoriesCount: (
              await ImportJob.findByPk(importJobId, { transaction: t })
            ).newCategoriesCount,
            newBrandsCount: (
              await ImportJob.findByPk(importJobId, { transaction: t })
            ).newBrandsCount,
            newVendorsCount: (
              await ImportJob.findByPk(importJobId, { transaction: t })
            ).newVendorsCount,
          },
          { transaction: t },
        );

        await t.commit();

        console.log(
          `[Job ${job.id}] Batch ${i / BATCH_SIZE + 1} done: ${batchResult.created.length} created, ${batchResult.failed.length} failed`,
        );
      } catch (batchErr) {
        await t.rollback();
        console.error(
          `[Job ${job.id}] Batch failed at row ~${i + 2}:`,
          batchErr,
        );

        failedRows.push({
          batchStartRow: i + 2,
          error: batchErr.message || "Batch processing failed",
        });

        await importJob.update({
          failedCount: failedRows.length,
          errorLog: failedRows,
        });
      }
    }

    // Final update
    await importJob.update({
      status: "completed",
      completedAt: new Date(),
      successCount,
      failedCount: failedRows.length,
      errorLog: failedRows,
    });

    console.log(
      `[Job ${job.id}] Completed: ${successCount} products imported, ${failedRows.length} failed`,
    );
  },
  {
    connection,
    concurrency: 1, // One import at a time — increase if your server can handle more
    autorun: true,
    stalledInterval: 30000, // Check for stalled jobs every 30s
    maxStalledCount: 3, // Retry stalled job up to 3 times
  },
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err);
});

worker.on("stalled", (jobId) => {
  console.warn(`[Worker] Job ${jobId} stalled — will retry`);
});

console.log("[Worker] Bulk import worker is running and listening for jobs...");
