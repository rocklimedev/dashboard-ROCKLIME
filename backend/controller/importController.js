// controllers/importController.js
const { bulkImportQueue } = require("../lib/queue");
const { ImportJob } = require("../models");
const { uploadToFtp } = require("../middleware/upload");
const { Op } = require("sequelize");
const { Product, Category, Brand, Vendor, Keyword } = require("../models");

// POST /api/imports/start
exports.startBulkImport = async (req, res) => {
  try {
    // ────────────────────────────── DEBUG LOGGING ──────────────────────────────

    if (!req.files?.file?.[0]) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file[0];

    // Get raw mapping string
    const rawMapping = req.body?.mapping;

    let mapping = {};

    if (typeof rawMapping === "string" && rawMapping.trim() !== "") {
      try {
        mapping = JSON.parse(rawMapping);
      } catch (parseErr) {
        return res.status(400).json({
          message: "Invalid mapping JSON format",
          error: parseErr.message,
        });
      }
    } else {
      console.warn("No valid mapping string received in req.body");
    }

    // Validation: check values (works with index-based mapping)
    const mappedFields = Object.values(mapping);
    const hasName = mappedFields.includes("name");
    const hasCode = mappedFields.includes("product_code");

    if (!hasName || !hasCode) {
      return res.status(400).json({
        message: 'Must map at least "name" and "product_code" fields',
        receivedMapping: mapping, // helpful for debugging
      });
    }

    // Log which columns were mapped to required fields
    const nameColumn = Object.keys(mapping).find((k) => mapping[k] === "name");
    const codeColumn = Object.keys(mapping).find(
      (k) => mapping[k] === "product_code",
    );

    // ────────────────────────────── NORMAL FLOW ──────────────────────────────
    const ftpPath = await uploadToFtp(file.buffer, file.originalname);

    const jobRecord = await ImportJob.create({
      filePath: ftpPath,
      originalFileName: file.originalname,
      mapping, // index → field mapping
      status: "pending",
      // userId: req.user?.id || null,
    });

    await bulkImportQueue.add(
      "process-bulk-import",
      { importJobId: jobRecord.id },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return res.status(202).json({
      message: "Bulk import job queued",
      jobId: jobRecord.id,
      status: "pending",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to queue import" });
  }
};

// GET /api/imports/:jobId/status  (unchanged)
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
    res.status(500).json({ message: "Error fetching import status" });
  }
};
// controllers/importController.js
// ... (keep your existing startBulkImport and getImportStatus)

// Add these new methods

/**
 * GET /api/imports
 * Get list of all import jobs (with optional filtering & pagination)
 * Admin or authenticated user can see their own jobs or all (depending on role)
 */
exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const where = {};

    // If not admin, only show user's own jobs
    if (req.user?.role !== "admin") {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: jobs } = await ImportJob.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        "id",
        "userId",
        "originalFileName",
        "status",
        "totalRows",
        "processedRows",
        "successCount",
        "failedCount",
        "newCategoriesCount",
        "newBrandsCount",
        "newVendorsCount",
        "createdAt",
        "updatedAt",
        "completedAt",
      ],
      // Optional: include user if needed (requires User model association)
      // include: [{ model: User, attributes: ["id", "username", "email"] }],
    });

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch import jobs",
      error: err.message,
    });
  }
};

/**
 * GET /api/imports/:jobId
 * Get detailed information about a single import job
 */
exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await ImportJob.findByPk(jobId, {
      attributes: [
        "id",
        "userId",
        "filePath",
        "originalFileName",
        "mapping",
        "status",
        "totalRows",
        "processedRows",
        "successCount",
        "failedCount",
        "newCategoriesCount",
        "newBrandsCount",
        "newVendorsCount",
        "errorLog",
        "createdAt",
        "updatedAt",
        "completedAt",
      ],
      // Optional: include user
      // include: [{ model: User, attributes: ["id", "username"] }],
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Import job not found",
      });
    }

    // Optional: restrict access (only owner or admin)
    if (req.user?.role !== "admin" && job.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this job",
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
      error: err.message,
    });
  }
};

/**
 * DELETE /api/imports/:jobId
 * Delete an import job (only if not processing / completed)
 * Soft-delete or hard-delete depending on your needs
 */
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await ImportJob.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Import job not found",
      });
    }

    // Permission check
    if (req.user?.role !== "admin" && job.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this job",
      });
    }

    // Optional: prevent deletion of running/completed jobs
    if (["processing", "completed"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job in ${job.status} status`,
      });
    }

    await job.destroy(); // hard delete
    // Alternative: soft delete → await job.update({ deletedAt: new Date() });

    res.json({
      success: true,
      message: "Import job deleted successfully",
      jobId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete import job",
      error: err.message,
    });
  }
};

/**
 * PATCH /api/imports/:jobId/status
 * Manually update job status (mostly for admin/debug purposes)
 * Example body: { status: "cancelled", note: "optional reason" }
 */
exports.updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const job = await ImportJob.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Import job not found",
      });
    }

    // Permission: usually only admin can force status change
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can manually update job status",
      });
    }

    const updateData = { status };

    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    if (note) {
      // Append to errorLog or create separate notes field if you have one
      job.errorLog = [
        ...(job.errorLog || []),
        {
          timestamp: new Date().toISOString(),
          message: `Status manually changed to ${status}: ${note}`,
        },
      ];
      updateData.errorLog = job.errorLog;
    }

    await job.update(updateData);

    res.json({
      success: true,
      message: `Job status updated to ${status}`,
      job: {
        id: job.id,
        status: job.status,
        updatedAt: job.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update job status",
      error: err.message,
    });
  }
};

// controllers/importController.js
exports.previewImportFile = async (req, res) => {
  try {
    if (!req.files?.file?.[0]) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file[0];
    let headers = [];
    let previewRows = []; // first 5 data rows

    try {
      if (file.originalname.toLowerCase().endsWith(".csv")) {
        const text = file.buffer.toString("utf-8");
        const parsed = Papa.parse(text, {
          skipEmptyLines: true,
          header: false,
        });

        if (parsed.data.length === 0) throw new Error("Empty file");

        headers = parsed.data[0].map((h) => (h || "").toString().trim());
        previewRows = parsed.data
          .slice(1, 6)
          .map((row) => row.map((cell) => (cell || "").toString().trim()));
      } else {
        // Excel
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
        });

        if (json.length === 0) throw new Error("Empty sheet");

        headers = (json[0] || []).map((h) => (h || "").toString().trim());
        previewRows = json.slice(1, 6).map((row) =>
          row.map((cell) => {
            if (cell == null) return "";
            if (typeof cell === "number") return cell.toString();
            if (cell instanceof Date) return cell.toISOString().split("T")[0];
            return cell.toString().trim();
          }),
        );
      }

      // Remove completely empty header columns
      const validHeaderIndices = headers
        .map((h, i) => (h ? i : null))
        .filter((i) => i !== null);

      headers = validHeaderIndices.map((i) => headers[i]);

      return res.json({
        success: true,
        headers,
        previewRows, // optional but very useful for user
        rowCountEstimate: previewRows.length > 0 ? "many" : 0, // or try to count
        originalFileName: file.originalname,
      });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: "Could not parse file",
        error: parseErr.message,
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error during preview" });
  }
};
/**
 * POST /api/imports/:jobId/cancel
 * Request cancellation of an import job
 */
exports.cancelImportJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await ImportJob.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Import job not found",
      });
    }

    // Permission check
    if (req.user?.role !== "admin" && job.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this job",
      });
    }

    if (
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel job in ${job.status} status`,
      });
    }

    // Mark as cancelling (or directly cancelled)
    await job.update({
      status: "cancelled",
      errorLog: [
        ...(job.errorLog || []),
        {
          timestamp: new Date().toISOString(),
          message: "Job cancellation requested by user",
        },
      ],
      completedAt: new Date(), // optional: mark as "done" in a cancelled way
    });

    // Try to remove from queue if still pending/processing
    try {
      const bullJob = await bulkImportQueue.getJob(jobId); // note: job.id in BullMQ is usually string
      if (bullJob) {
        await bullJob.remove();
      }
    } catch (queueErr) {
      console.warn(
        `[Cancel] Could not remove job ${jobId} from BullMQ queue:`,
        queueErr.message,
      );
      // still proceed — worker will see cancelled status
    }

    res.json({
      success: true,
      message: "Cancellation requested. Job will stop as soon as possible.",
      jobId,
      status: "cancelled",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel import job",
      error: err.message,
    });
  }
};
