// routes/jobRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer"); // if not already set up globally
const { auth } = require("../middleware/auth");
const jobController = require("../controller/jobController");

router.use(auth);
// Optional: Configure multer for file uploads (if not global)
// You can also handle this in app.js or middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit example
});

// ───────────────────────────────────────────────
//                Bulk Import Routes
// ───────────────────────────────────────────────

// 1. Preview uploaded file (get headers + sample rows)
router.post(
  "/bulk-import/preview",
  upload.fields([{ name: "file", maxCount: 1 }]),
  jobController.previewImportFile,
);

// 2. Start bulk import job (with mapping)
// jobRoutes.js
router.post(
  "/bulk-import/start",
  upload.fields([{ name: "file", maxCount: 1 }]), // ← changed line
  jobController.startBulkImport,
);

// ───────────────────────────────────────────────
//                General Job Routes
// ───────────────────────────────────────────────

// 3. Get list of all jobs (with filters & pagination)
router.get(
  "/",
  // authMiddleware,           // uncomment if needed
  jobController.getAllJobs,
);

// 4. Get single job details
router.get(
  "/:jobId",
  // authMiddleware,
  jobController.getJobById,
);

// 5. Get job status (simplified view)
router.get(
  "/:jobId/status",
  // authMiddleware,
  jobController.getJobStatus,
);

// 6. Cancel a running/pending job
router.post(
  "/:jobId/cancel",
  // authMiddleware,
  jobController.cancelJob,
);

// 7. Delete a job (only if not running/completed)
router.delete(
  "/:jobId",
  // authMiddleware,
  jobController.deleteJob,
);

// 8. Manually update job status (admin only)
router.patch(
  "/:jobId/status",
  // authMiddleware,
  // adminMiddleware,          // recommended
  jobController.updateJobStatus,
);

// ───────────────────────────────────────────────
//           Example: Other job type routes
// ───────────────────────────────────────────────

// Start report generation job (example of another job type)
router.post(
  "/reports/generate",
  // authMiddleware,
  jobController.startReportGeneration,
  // You can add more validation/upload middleware here if needed
);
router.get(
  "/:jobId/successful-entries",
  jobController.downloadSuccessfulEntries,
);

module.exports = router;
