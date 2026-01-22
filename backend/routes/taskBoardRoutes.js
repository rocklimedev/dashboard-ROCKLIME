const express = require("express");
const router = express.Router();
const taskBoardController = require("../controller/taskBoardController");
const { auth } = require("../middleware/auth");
router.use(auth);
// TaskBoard routes
router.post("/", taskBoardController.createTaskBoard); // Create a new TaskBoard
router.get("/:id", taskBoardController.getTaskBoardById); // Get TaskBoard by ID
router.get(
  "/resource/:resourceType/:resourceId",
  taskBoardController.getTaskBoardsByResource,
); // Get TaskBoards by resource type and ID
router.put("/:id", taskBoardController.updateTaskBoard); // Update TaskBoard
router.put("/:id/archive", taskBoardController.archiveTaskBoard); // Archive/Unarchive TaskBoard
router.delete("/:id", taskBoardController.deleteTaskBoard); // Delete TaskBoard
router.get("/owner/:ownerId", taskBoardController.getTaskBoardsByOwner); // Get TaskBoards by owner
router.get("/creator/:creatorId", taskBoardController.getTaskBoardsByCreator); // Get TaskBoards by creator
router.put("/:id/members", taskBoardController.manageTaskBoardMember); // Add or remove TaskBoard member
router.get("/:id/stats", taskBoardController.getTaskBoardStats); // Get TaskBoard statistics

module.exports = router;
