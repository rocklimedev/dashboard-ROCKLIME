// controllers/jobController.js
const { jobsQueue } = require("../lib/queue"); // Assuming renamed from bulkImportQueue to jobsQueue
const { Job } = require("../models");
const { uploadToFtp } = require("../middleware/upload");
const { downloadFromFtp } = require("../middleware/upload"); // Assuming you have a download function
const { Op } = require("sequelize");
const { Product, Category, Brand, Vendor, Keyword } = require("../models");
const Papa = require("papaparse");
const XLSX = require("xlsx");

// POST /api/jobs/bulk-import/start
exports.startBulkImport = async (req, res) => {
  try {
    // ────────────────────────────── DEBUG LOGGING ──────────────────────────────
    console.log("=== startBulkImport called ===");
    console.log("req.files present?", !!req.files);
    console.log("req.files.file?", !!req.files?.file?.[0]);
    console.log("req.body keys:", Object.keys(req.body || {}));
    console.log("req.body full:", req.body);

    if (!req.files?.file?.[0]) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file[0];

    // Get raw mapping string
    const rawMapping = req.body?.mapping;
    console.log("raw req.body.mapping:", rawMapping);
    console.log("typeof rawMapping:", typeof rawMapping);

    let mapping = {};

    if (typeof rawMapping === "string" && rawMapping.trim() !== "") {
      try {
        mapping = JSON.parse(rawMapping);
        console.log("Successfully parsed mapping:", mapping);
        console.log("Mapping values:", Object.values(mapping));
      } catch (parseErr) {
        console.error("JSON parse error on mapping:", parseErr.message);
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

    console.log("hasName:", hasName, "hasCode:", hasCode);

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

    console.log(`[startBulkImport] name mapped to column index: ${nameColumn}`);
    console.log(
      `[startBulkImport] product_code mapped to column index: ${codeColumn}`,
    );

    // ────────────────────────────── NORMAL FLOW ──────────────────────────────
    const ftpPath = await uploadToFtp(file.buffer, file.originalname);

    const jobRecord = await Job.create({
      type: "bulk-import",
      params: {
        filePath: ftpPath,
        originalFileName: file.originalname,
        mapping, // index → field mapping
      },
      status: "pending",
      progress: {
        totalRows: 0,
        processedRows: 0,
        successCount: 0,
        failedCount: 0,
      },
      results: {
        newCategoriesCount: 0,
        newBrandsCount: 0,
        newVendorsCount: 0,
      },
      userId: req.user?.id || null,
    });

    await jobsQueue.add(
      "process-job",
      { jobId: jobRecord.id },
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
    console.error("Start import error:", err);
    return res.status(500).json({ message: "Failed to queue import" });
  }
};

// GET /api/jobs/:jobId/status
exports.getJobStatus = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      jobId: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      results: job.results,
      errorLog: job.errorLog || [],
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching job status" });
  }
};

// GET /api/jobs
// GET /api/jobs
exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      userId: queryUserId, // rename to avoid confusion
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const where = {};

    // Other filters
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: jobs } = await Job.findAndCountAll({
      where, // now guaranteed: no undefined values
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        "id",
        "type",
        "userId",
        "params",
        "status",
        "progress",
        "results",
        "createdAt",
        "updatedAt",
        "completedAt",
      ],
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
    console.error("Error fetching jobs:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: err.message,
    });
  }
};

// controllers/jobController.js

// GET /api/jobs/:jobId
exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    // ────────────────────────────── Logging for debugging ──────────────────────────────
    console.log(`[getJobById] Requested jobId: ${jobId}`);
    console.log(
      `[getJobById] User: ${req.user?.id || "anonymous"}, Role: ${req.user?.role || "none"}`,
    );

    // Validate UUID format (very helpful in development)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      console.warn(`[getJobById] Invalid UUID format: ${jobId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format. Expected UUID.",
        received: jobId,
      });
    }

    // Fetch the job with selected fields
    const job = await Job.findByPk(jobId, {
      attributes: [
        "id",
        "type",
        "userId",
        "params",
        "status",
        "progress",
        "results",
        "errorLog",
        "createdAt",
        "updatedAt",
        "completedAt",
      ],
      // Optional: include the user who created the job (uncomment if needed)
      // include: [
      //   {
      //     model: require("../models").User,
      //     as: "user",
      //     attributes: ["id", "username", "email", "role"],
      //   },
      // ],
    });

    if (!job) {
      console.log(`[getJobById] Job not found for ID: ${jobId}`);
      // Optional: confirm no record exists (for debugging)
      const count = await Job.count({ where: { id: jobId } });
      if (count === 0) {
        console.log(`[getJobById] Confirmed: 0 records with id = ${jobId}`);
      }

      return res.status(404).json({
        success: false,
        message: "Job not found",
        jobId, // helpful for frontend debugging
      });
    }

    // ────────────────────────────── Success response ──────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        userId: job.userId,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        params: job.params || {},
        progress: job.progress || {},
        results: job.results || {},
        errorLog: job.errorLog || [],
        // If you uncommented the include above, you can add:
        // createdBy: job.user ? { id: job.user.id, username: job.user.username } : null,
      },
    });
  } catch (err) {
    console.error("[getJobById] Error:", err.message);
    console.error(err.stack); // full stack for serious debugging

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
// DELETE /api/jobs/:jobId
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
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
      message: "Job deleted successfully",
      jobId,
    });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: err.message,
    });
  }
};

// PATCH /api/jobs/:jobId/status
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

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
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
        type: job.type,
        status: job.status,
        updatedAt: job.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error updating job status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update job status",
      error: err.message,
    });
  }
};

// POST /api/jobs/bulk-import/preview
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
      console.error("Preview parse error:", parseErr);
      return res.status(400).json({
        success: false,
        message: "Could not parse file",
        error: parseErr.message,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during preview" });
  }
};

// POST /api/jobs/:jobId/cancel
exports.cancelJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
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

    // Mark as cancelled
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
      const bullJob = await jobsQueue.getJob(jobId.toString()); // BullMQ job IDs are strings
      if (bullJob) {
        await bullJob.remove();
        console.log(`[Cancel] Removed job ${jobId} from queue`);
      }
    } catch (queueErr) {
      console.warn(
        `[Cancel] Could not remove job ${jobId} from BullMQ queue:`,
        queueErr.message,
      );
      // still proceed — worker will see cancelled status and stop
    }

    res.json({
      success: true,
      message: "Cancellation requested. Job will stop as soon as possible.",
      jobId,
      status: "cancelled",
    });
  } catch (err) {
    console.error("Cancel job error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel job",
      error: err.message,
    });
  }
};

// Example for another job type: POST /api/jobs/report-generation/start
// This is a placeholder for how to add more job types
exports.startReportGeneration = async (req, res) => {
  try {
    // Type-specific validation and params
    const { reportType, filters } = req.body; // Example params

    if (!reportType) {
      return res.status(400).json({ message: "Report type required" });
    }

    const jobRecord = await Job.create({
      type: "report-generation",
      params: { reportType, filters },
      status: "pending",
      progress: { totalSteps: 0, completedSteps: 0 },
      results: {},
      userId: req.user?.id || null,
    });

    await jobsQueue.add(
      "process-job",
      { jobId: jobRecord.id },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return res.status(202).json({
      message: "Report generation job queued",
      jobId: jobRecord.id,
      status: "pending",
    });
  } catch (err) {
    console.error("Start report generation error:", err);
    return res.status(500).json({ message: "Failed to queue job" });
  }
};
// controllers/jobController.js

exports.downloadSuccessfulEntries = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findByPk(jobId, {
      attributes: ["results"],
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const jsonPath = job.results?.successfulEntriesJsonPath;

    if (!jsonPath) {
      return res.status(404).json({
        message: "No successful entries JSON available for this job",
      });
    }

    // Assuming you have a function that generates signed URL or streams from FTP
    // Variant 1: Signed temporary URL (best)
    // const downloadUrl = await generateSignedFtpUrl(jsonPath, 3600); // 1 hour

    // Variant 2: Stream directly (more server load)
    const fileBuffer = await downloadFromFtp(jsonPath);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="successful-entries-job-${jobId}.json"`,
    );

    return res.send(fileBuffer);
  } catch (err) {
    console.error("Download successful entries error:", err);
    res.status(500).json({ message: "Failed to download file" });
  }
};
// Add more start methods for other job types as needed...
