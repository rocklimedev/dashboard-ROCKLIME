// workers/jobProcessor.js
// This file should be run as a separate process (e.g. node workers/jobProcessor.js or via pm2)

const { Worker } = require("bullmq");
const path = require("path");
const fs = require("fs").promises;
const Papa = require("papaparse");
const XLSX = require("xlsx");

// ─── Your models ───
const { Job, Product, Category, Brand, Vendor } = require("../models");

// ─── Your FTP helper ───
const { downloadFromFtp } = require("../middleware/upload"); // adjust path if needed

// ─── Redis connection (exactly matching your lib/queue.js) ───
const IORedis = require("ioredis");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  family: 4,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    console.log(`Redis retry ${times}...`);
    return Math.min(times * 100, 5000);
  },
});

connection.on("connect", () => console.log("[Redis Worker] Socket connected"));
connection.on("ready", () =>
  console.log("[Redis Worker] Ready (commands accepted)"),
);
connection.on("error", (err) =>
  console.error("[Redis Worker] Error:", err.message),
);
connection.on("reconnecting", (delay) =>
  console.log(`[Redis Worker] Reconnecting in ${delay}ms`),
);

// ─── Create the worker ───
// IMPORTANT: queue name MUST be "jobs" (not "jobsQueue")
const worker = new Worker(
  "jobs", // ← matches new Queue("jobs", ...)
  async (bullJob) => {
    const { jobId } = bullJob.data;

    console.log(
      `[Worker ${bullJob.id}] Processing job ID: ${jobId} (attempt ${bullJob.attemptsMade + 1})`,
    );

    // Load job from database
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new Error(`Job record ${jobId} not found in database`);
    }

    // Early exit if already cancelled
    if (job.status === "cancelled") {
      console.log(
        `[Worker ${bullJob.id}] Job ${jobId} already cancelled → skipping`,
      );
      return { status: "cancelled" };
    }

    // Mark as processing
    await job.update({
      status: "processing",
      updatedAt: new Date(),
    });

    try {
      if (job.type === "bulk-import") {
        await processBulkImport(job, bullJob);
      }
      // Add support for other types when needed
      // else if (job.type === 'report-generation') { ... }
      else {
        throw new Error(`Unsupported job type: ${job.type}`);
      }

      // ── Success ──
      await job.update({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`[Worker ${bullJob.id}] Job ${jobId} → COMPLETED`);
      return { status: "completed" };
    } catch (err) {
      console.error(`[Worker ${bullJob.id}] Job ${jobId} failed:`, err.message);

      const logEntry = {
        timestamp: new Date().toISOString(),
        message: err.message,
        // stack only in dev
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      };

      await job.update({
        status: "failed",
        errorLog: [...(job.errorLog || []), logEntry],
        updatedAt: new Date(),
      });

      throw err; // allow BullMQ retries
    }
  },
  {
    connection,
    concurrency: 2, // ← tune this (1–5 depending on CPU + DB capacity)
    autorun: true,
    stalledInterval: 30000,
    maxStalledCount: 2,
    // Optional: limit throughput
    // limiter: { max: 5, duration: 10000 },
  },
);

// ───────────────────────────────────────────────
//   BULK IMPORT PROCESSOR
// ───────────────────────────────────────────────
async function processBulkImport(job, bullJob) {
  const { filePath, originalFileName, mapping } = job.params || {};

  if (!filePath || !originalFileName) {
    throw new Error("Missing filePath or originalFileName in job params");
  }

  const tempDir = path.join(__dirname, "..", "temp");
  const tempFile = path.join(
    tempDir,
    `${job.id}-${Date.now()}-${originalFileName}`,
  );

  try {
    await fs.mkdir(tempDir, { recursive: true });

    // Download from FTP
    console.log(`[Worker] Downloading ${filePath} → ${tempFile}`);
    const fileBuffer = await downloadFromFtp(filePath);
    await fs.writeFile(tempFile, fileBuffer);

    // ── Parse file ───────────────────────────────────────
    let rows = [];
    let headers = [];

    const lowerName = originalFileName.toLowerCase();

    if (lowerName.endsWith(".csv")) {
      const text = await fs.readFile(tempFile, "utf-8");
      const parsed = Papa.parse(text, {
        skipEmptyLines: true,
        header: false,
      });
      if (parsed.errors.length)
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      headers = parsed.data[0] || [];
      rows = parsed.data.slice(1);
    } else {
      // Excel
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

    // Initialize / reset progress
    await job.update({
      progress: {
        totalRows: rows.length,
        processedRows: 0,
        successCount: 0,
        failedCount: 0,
      },
      results: { newCategoriesCount: 0, newBrandsCount: 0, newVendorsCount: 0 },
    });

    // Field → column index map
    const fieldToCol = {};
    Object.entries(mapping || {}).forEach(([idxStr, field]) => {
      const idx = Number(idxStr);
      if (!isNaN(idx)) fieldToCol[field] = idx;
    });

    // Validate required fields
    ["name", "product_code"].forEach((f) => {
      if (!(f in fieldToCol))
        throw new Error(`Required field "${f}" not mapped`);
    });

    // ── Row processing loop ─────────────────────────────────
    let success = 0;
    let failed = 0;
    let newCat = 0,
      newBrand = 0,
      newVendor = 0;

    for (let i = 0; i < rows.length; i++) {
      // Cancellation check (every 30 rows)
      if (i % 30 === 0) {
        await job.reload({ plain: true });
        if (job.status === "cancelled")
          throw new Error("Processing cancelled by user");
      }

      const row = rows[i];
      const data = {};
      Object.entries(fieldToCol).forEach(([field, col]) => {
        data[field] = row[col] == null ? null : String(row[col]).trim();
      });

      try {
        // Find/Create related records (case-sensitive names – consider normalization)
        const [cat] = await Category.findOrCreate({
          where: { name: data.category || "Uncategorized" },
          defaults: { name: data.category || "Uncategorized" },
        });
        if (cat.isNewRecord) newCat++;

        const [brd] = await Brand.findOrCreate({
          where: { name: data.brand || "No Brand" },
          defaults: { name: data.brand || "No Brand" },
        });
        if (brd.isNewRecord) newBrand++;

        const [ven] = await Vendor.findOrCreate({
          where: { name: data.vendor || "Unknown" },
          defaults: { name: data.vendor || "Unknown" },
        });
        if (ven.isNewRecord) newVendor++;

        await Product.create({
          name: data.name,
          product_code: data.product_code,
          categoryId: cat.id,
          brandId: brd.id,
          vendorId: ven.id,
          // Extend here: description, price, sku, images, keywords, etc.
        });

        success++;
      } catch (rowErr) {
        failed++;
        await job.update({
          errorLog: [
            ...(job.errorLog || []),
            {
              timestamp: new Date().toISOString(),
              message: `Row ${i + 2}: ${rowErr.message}`,
              data: data,
            },
          ],
        });
      }

      // Progress update (every 50 rows or last)
      if (i % 50 === 0 || i === rows.length - 1) {
        await job.update({
          progress: {
            totalRows: rows.length,
            processedRows: i + 1,
            successCount: success,
            failedCount: failed,
          },
          results: {
            newCategoriesCount: newCat,
            newBrandsCount: newBrand,
            newVendorsCount: newVendor,
          },
        });
      }
    }

    // Final save
    await job.update({
      progress: {
        totalRows: rows.length,
        processedRows: rows.length,
        successCount: success,
        failedCount: failed,
      },
      results: {
        newCategoriesCount: newCat,
        newBrandsCount: newBrand,
        newVendorsCount: newVendor,
      },
    });
  } finally {
    // Cleanup
    try {
      await fs.unlink(tempFile);
      console.log(`[Worker] Removed temp file: ${tempFile}`);
    } catch (e) {
      if (e.code !== "ENOENT")
        console.warn("[Worker] Temp file cleanup failed", e);
    }
  }
}

// ─── Worker events ───────────────────────────────────────
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

// Graceful shutdown
const shutdown = async (sig) => {
  console.log(`[Worker] Received ${sig} → closing...`);
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log('[Worker] Started – listening on queue "jobs"');
