const TaskBoard = require("../models/taskBoard");
const Task = require("../models/tasks");
const { User } = require("../models");
const {
  validateTaskBoard,
  sendErrorResponse,
  sendSuccessResponse,
} = require("../utils/taskUtils");
const mongoose = require("mongoose");

// Create TaskBoard
exports.createTaskBoard = async (req, res) => {
  try {
    const { name, description, resourceType, resourceId, owner, createdBy } =
      req.body;

    // Validate required fields
    if (!name?.trim() || !resourceType || !resourceId || !owner || !createdBy) {
      return sendErrorResponse(
        res,
        400,
        "name, resourceType, resourceId, owner, and createdBy are required"
      );
    }

    // Validate users (MySQL)
    const [ownerUser, createdByUser] = await Promise.all([
      User.findByPk(owner, { attributes: ["userId"] }),
      User.findByPk(createdBy, { attributes: ["userId"] }),
    ]);

    if (!ownerUser) return sendErrorResponse(res, 404, "Owner user not found");
    if (!createdByUser)
      return sendErrorResponse(res, 404, "Creator user not found");

    // Validate resource (similar to validateResourceLink)
    const resourceValidation = await validateResourceLink(
      resourceType,
      resourceId
    );
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    // Create TaskBoard
    const taskBoard = await TaskBoard.create({
      name: name.trim(),
      description: description?.trim(),
      resourceType,
      resourceId,
      owner,
      createdBy,
    });

    return sendSuccessResponse(
      res,
      taskBoard,
      "TaskBoard created successfully"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to create TaskBoard",
      err.message
    );
  }
};

// Get TaskBoard by ID
exports.getTaskBoardById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
    }

    const taskBoard = await TaskBoard.findById(id).lean();
    if (!taskBoard) return sendErrorResponse(res, 404, "TaskBoard not found");

    // Fetch tasks associated with the TaskBoard
    const tasks = await Task.find({ taskBoard: id, isArchived: false })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user details in bulk (MySQL)
    const userIds = [
      taskBoard.owner,
      taskBoard.createdBy,
      ...new Set(tasks.flatMap((task) => [task.assignedTo, task.assignedBy])),
    ];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name", "email"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    // Map tasks with user details
    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      assignedToUser: userMap.get(task.assignedTo) || null,
      assignedByUser: userMap.get(task.assignedBy) || null,
    }));

    return sendSuccessResponse(res, {
      taskBoard,
      tasks: tasksWithUsers,
      ownerUser: userMap.get(taskBoard.owner) || null,
      createdByUser: userMap.get(taskBoard.createdBy) || null,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch TaskBoard",
      err.message
    );
  }
};

// Get TaskBoards by Resource
exports.getTaskBoardsByResource = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    if (!resourceType || !resourceId) {
      return sendErrorResponse(
        res,
        400,
        "resourceType and resourceId are required"
      );
    }

    const taskBoards = await TaskBoard.find({
      resourceType,
      resourceId,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user details in bulk (MySQL)
    const userIds = [
      ...new Set(taskBoards.flatMap((board) => [board.owner, board.createdBy])),
    ];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name", "email"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    // Map task boards with user details
    const taskBoardsWithUsers = taskBoards.map((board) => ({
      ...board,
      ownerUser: userMap.get(board.owner) || null,
      createdByUser: userMap.get(board.createdBy) || null,
    }));

    return sendSuccessResponse(res, {
      taskBoards: taskBoardsWithUsers,
      totalCount: taskBoardsWithUsers.length,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch TaskBoards",
      err.message
    );
  }
};

// Update TaskBoard
exports.updateTaskBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
    }

    const taskBoard = await TaskBoard.findById(id);
    if (!taskBoard) return sendErrorResponse(res, 404, "TaskBoard not found");

    // Validate updates
    if (updates.owner) {
      const ownerUser = await User.findByPk(updates.owner, {
        attributes: ["userId"],
      });
      if (!ownerUser)
        return sendErrorResponse(res, 404, "Owner user not found");
    }

    if (updates.resourceType && updates.resourceId) {
      const resourceValidation = await validateResourceLink(
        updates.resourceType,
        updates.resourceId
      );
      if (!resourceValidation.valid) {
        return sendErrorResponse(res, 404, resourceValidation.error);
      }
    }

    Object.assign(taskBoard, updates);
    await taskBoard.save();

    return sendSuccessResponse(
      res,
      taskBoard,
      "TaskBoard updated successfully"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to update TaskBoard",
      err.message
    );
  }
};

// Archive TaskBoard
exports.archiveTaskBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive, userId } = req.body;

    if (archive === undefined || !userId) {
      return sendErrorResponse(res, 400, "archive and userId are required");
    }

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
    }

    const taskBoard = await TaskBoard.findById(id);
    if (!taskBoard) return sendErrorResponse(res, 404, "TaskBoard not found");

    taskBoard.isArchived = archive;
    taskBoard.archivedAt = archive ? new Date() : null;
    taskBoard.archivedBy = archive ? userId : null;
    await taskBoard.save();

    // Optionally archive all tasks in the TaskBoard
    if (archive) {
      await Task.updateMany(
        { taskBoard: id, isArchived: false },
        { isArchived: true, archivedAt: new Date(), archivedBy: userId }
      );
    }

    return sendSuccessResponse(
      res,
      taskBoard,
      archive
        ? "TaskBoard archived successfully"
        : "TaskBoard unarchived successfully"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to archive TaskBoard",
      err.message
    );
  }
};

// Delete TaskBoard
exports.deleteTaskBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteTasks = false } = req.body; // Option to delete or archive tasks

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
    }

    const taskBoard = await TaskBoard.findById(id);
    if (!taskBoard) return sendErrorResponse(res, 404, "TaskBoard not found");

    // Check for associated tasks
    const tasks = await Task.find({ taskBoard: id, isArchived: false });
    if (tasks.length && !deleteTasks) {
      // Archive tasks instead of deleting
      await Task.updateMany(
        { taskBoard: id, isArchived: false },
        {
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: req.body.userId,
        }
      );
    } else if (tasks.length && deleteTasks) {
      // Delete tasks
      await Task.deleteMany({ taskBoard: id });
    }

    await taskBoard.remove();

    return sendSuccessResponse(
      res,
      null,
      `TaskBoard deleted successfully${
        deleteTasks ? " with tasks" : ", tasks archived"
      }`
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to delete TaskBoard",
      err.message
    );
  }
};

// Get TaskBoards by Owner
exports.getTaskBoardsByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return sendErrorResponse(res, 400, "ownerId is required");
    }

    const ownerUser = await User.findByPk(ownerId, { attributes: ["userId"] });
    if (!ownerUser) return sendErrorResponse(res, 404, "Owner user not found");

    const taskBoards = await TaskBoard.find({
      owner: ownerId,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user details for createdBy
    const userIds = [...new Set(taskBoards.map((board) => board.createdBy))];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name", "email"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    const taskBoardsWithUsers = taskBoards.map((board) => ({
      ...board,
      ownerUser: ownerUser.toJSON(),
      createdByUser: userMap.get(board.createdBy) || null,
    }));

    return sendSuccessResponse(res, {
      taskBoards: taskBoardsWithUsers,
      totalCount: taskBoardsWithUsers.length,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch TaskBoards by owner",
      err.message
    );
  }
};

// Get TaskBoards by Creator
exports.getTaskBoardsByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return sendErrorResponse(res, 400, "creatorId is required");
    }

    const creatorUser = await User.findByPk(creatorId, {
      attributes: ["userId"],
    });
    if (!creatorUser)
      return sendErrorResponse(res, 404, "Creator user not found");

    const taskBoards = await TaskBoard.find({
      createdBy: creatorId,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user details for owner
    const userIds = [...new Set(taskBoards.map((board) => board.owner))];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name", "email"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    const taskBoardsWithUsers = taskBoards.map((board) => ({
      ...board,
      ownerUser: userMap.get(board.owner) || null,
      createdByUser: creatorUser.toJSON(),
    }));

    return sendSuccessResponse(res, {
      taskBoards: taskBoardsWithUsers,
      totalCount: taskBoardsWithUsers.length,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch TaskBoards by creator",
      err.message
    );
  }
};

// Add or Remove TaskBoard Member
exports.manageTaskBoardMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
    }

    if (!userId || !["add", "remove"].includes(action)) {
      return sendErrorResponse(
        res,
        400,
        "userId and valid action (add/remove) are required"
      );
    }

    const taskBoard = await TaskBoard.findById(id);
    if (!taskBoard) return sendErrorResponse(res, 404, "TaskBoard not found");

    const user = await User.findByPk(userId, { attributes: ["userId"] });
    if (!user) return sendErrorResponse(res, 404, "User not found");

    // Add or remove member (watchers)
    if (!taskBoard.watchers) taskBoard.watchers = [];
    if (action === "add" && !taskBoard.watchers.includes(userId)) {
      taskBoard.watchers.push(userId);
    } else if (action === "remove") {
      taskBoard.watchers = taskBoard.watchers.filter((w) => w !== userId);
    } else {
      return sendErrorResponse(
        res,
        400,
        `User already ${action === "add" ? "added" : "removed"}`
      );
    }

    await taskBoard.save();

    return sendSuccessResponse(
      res,
      taskBoard,
      `Member ${action}ed successfully`
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to manage TaskBoard member",
      err.message
    );
  }
};

// Get TaskBoard Statistics
exports.getTaskBoardStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
    }

    const taskBoard = await TaskBoard.findById(id);
    if (!taskBoard) return sendErrorResponse(res, 404, "TaskBoard not found");

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      criticalTasks,
      highPriorityTasks,
    ] = await Promise.all([
      Task.countDocuments({ taskBoard: id, isArchived: false }),
      Task.countDocuments({
        taskBoard: id,
        status: "PENDING",
        isArchived: false,
      }),
      Task.countDocuments({
        taskBoard: id,
        status: "IN_PROGRESS",
        isArchived: false,
      }),
      Task.countDocuments({
        taskBoard: id,
        status: "COMPLETED",
        isArchived: false,
      }),
      Task.countDocuments({
        taskBoard: id,
        dueDate: { $lt: new Date() },
        status: { $nin: ["COMPLETED", "CANCELLED"] },
        isArchived: false,
      }),
      Task.countDocuments({
        taskBoard: id,
        priority: "critical",
        isArchived: false,
      }),
      Task.countDocuments({
        taskBoard: id,
        priority: "high",
        isArchived: false,
      }),
    ]);

    const stats = {
      total: totalTasks,
      byStatus: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
      },
      overdue: overdueTasks,
      byPriority: {
        critical: criticalTasks,
        high: highPriorityTasks,
      },
      completionRate:
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
    };

    return sendSuccessResponse(
      res,
      stats,
      "TaskBoard statistics fetched successfully"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch TaskBoard statistics",
      err.message
    );
  }
};
