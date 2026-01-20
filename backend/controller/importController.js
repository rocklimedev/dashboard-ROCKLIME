// controllers/importController.js
const { bulkImportQueue } = require("../lib/queue");
const { ImportJob } = require("../models");
const { uploadToFtp } = require("../middleware/upload");
const { Op } = require("sequelize");
const { Product, Category, Brand, Vendor, Keyword } = require("../models");

// POST /api/imports/start
exports.startBulkImport = async (req, res) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file[0];
    let mapping;

    try {
      mapping = JSON.parse(req.body.mapping || "{}");
    } catch (e) {
      return res.status(400).json({ message: "Invalid mapping JSON" });
    }

    // Basic required fields check
    if (!mapping.name || !mapping.product_code) {
      return res.status(400).json({
        message: 'Must map at least "name" and "product_code" fields',
      });
    }

    // Upload file to FTP (reuse your existing function)
    const ftpPath = await uploadToFtp(file.buffer, file.originalname);

    // Create job record
    const jobRecord = await ImportJob.create({
      filePath: ftpPath,
      originalFileName: file.originalname,
      mapping,
      status: "pending",
      // userId: req.user?.id || null,   // ← if you have authentication
    });

    // Add job to BullMQ queue
    await bulkImportQueue.add(
      "process-bulk-import",
      {
        importJobId: jobRecord.id,
      },
      {
        attempts: 3, // retry up to 3 times if fails
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: false, // keep job for history
        removeOnFail: false,
      },
    );

    return res.status(202).json({
      message: "Bulk import job queued",
      jobId: jobRecord.id,
      status: "pending",
    });
  } catch (err) {
    console.error("Start import error:", err);
    return res.status(500).json({ message: "Failed to queue import" });
  }
};

// GET /api/imports/:jobId/status
exports.getImportStatus = async (req, res) => {
  try {
    const job = await ImportJob.findByPk(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Import job not found" });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successCount: job.successCount,
      failedCount: job.failedCount,
      newCategories: job.newCategoriesCount,
      newBrands: job.newBrandsCount,
      newVendors: job.newVendorsCount,
      errorLog: job.errorLog || [],
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching import status" });
  }
};
