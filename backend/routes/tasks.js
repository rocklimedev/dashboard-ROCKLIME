const express = require("express");
const router = express.Router();
const multer = require("multer");
const taskController = require("../controller/taskController");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for FTP upload
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Create a task
router.post("/", taskController.createTask);

// Get all tasks with filters
router.get("/", taskController.getTasks);

// Get task by ID
router.get("/:id", taskController.getTaskById);

// Update task
router.put("/:id", taskController.updateTask);

// Add or remove watcher
router.put("/:id/watchers", taskController.manageWatcher);

// Add attachment
router.post(
  "/:id/attachments",
  upload.single("file"),
  taskController.addAttachment
);

// Get task statistics
router.get("/stats", taskController.getTaskStats);

// Get tasks by linked resource
router.get(
  "/resource/:resourceType/:resourceId",
  taskController.getTasksByResource
);

// Bulk update tasks
router.put("/bulk-update", taskController.bulkUpdateTasks);

// Get tasks assigned to a user
router.get("/user/:userId", taskController.getMyTasks);

// Get tasks created by a user
router.get("/created/:userId", taskController.getCreatedTasks);

// Get overdue tasks
router.get("/overdue", taskController.getOverdueTasks);

// Clone a task
router.post("/:id/clone", taskController.cloneTask);

// Update time tracking
router.put("/:id/time-tracking", taskController.updateTimeTracking);

// Delete a task
router.delete("/:id", taskController.deleteTask);

// Archive or unarchive a task
router.put("/:id/archive", taskController.archiveTask);

// Update checklist item
router.put("/:id/checklist", taskController.updateChecklistItem);

module.exports = router;
