// routes/importRoutes.js
const express = require("express");
const router = express.Router();
const importController = require("../controller/importController");
const multer = require("multer");
const { auth } = require("../middleware/auth");
router.use(auth);
// Multer setup for file upload (in-memory for simplicity, or disk if preferred)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // e.g. 50MB limit – adjust as needed
});

// POST /api/imports/start  →  start bulk import job (file + mapping)
router.post(
  "/start",
  upload.fields([{ name: "file", maxCount: 1 }]), // matches req.files.file
  importController.startBulkImport,
); // GET /api/imports/:jobId/status  →  get progress/status
router.get("/:jobId/status", importController.getImportStatus);

router.get("/", importController.getAllJobs);
router.get("/:jobId", importController.getJobById);

// Admin-only or restricted routes
router.delete("/:jobId", importController.deleteJob);
router.patch(
  "/:jobId/status",

  importController.updateJobStatus,
);
module.exports = router;
