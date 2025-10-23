const mongoose = require("mongoose");
const Task = require("../models/tasks");
const User = require("../models/users");
const {
  uploadToCDN,
  validateResourceLink,
  sendErrorResponse,
  sendSuccessResponse,
  validateTaskData,
  notifyTaskStakeholders,
} = require("../utils/taskUtils");
const sanitizeHtml = require("sanitize-html");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      assignedBy,
      assignedTeamId,
      priority = "medium",
      status = "PENDING",
      dueDate,
      startDate,
      estimatedHours,
      tags = [],
      checklist = [],
      linkedResource,
      watchers = [],
      dependsOn = [],
      recurrence = {},
      taskBoard, // Add taskBoard
    } = req.body;

    // Validate task data
    const {
      assignedToUser,
      assignedByUser,
      taskBoard: taskBoardDoc,
    } = await validateTaskData({
      title,
      assignedTo,
      assignedBy,
      assignedTeamId,
      priority,
      status,
      dueDate,
      startDate,
      watchers,
      dependsOn,
      taskBoard, // Include taskBoard in validation
    });

    // Validate linked resource
    if (linkedResource?.resourceType && linkedResource.resourceId) {
      const resourceValidation = await validateResourceLink(
        linkedResource.resourceType,
        linkedResource.resourceId
      );
      if (!resourceValidation.valid) {
        return sendErrorResponse(res, 404, resourceValidation.error);
      }
    }

    // Create task
    const task = await Task.create({
      title: sanitizeHtml(title.trim(), {
        allowedTags: [],
        allowedAttributes: {},
      }),
      description: description
        ? sanitizeHtml(description.trim(), {
            allowedTags: ["br", "p", "strong", "em"],
            allowedAttributes: {},
          })
        : undefined,
      assignedTo,
      assignedBy,
      assignedTeamId,
      priority: priority.toLowerCase(),
      status: status.toUpperCase(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      estimatedHours,
      tags,
      checklist,
      linkedResource,
      watchers,
      dependsOn,
      recurrence,
      taskBoard, // Add taskBoard to task creation
    });

    // Notify stakeholders
    await notifyTaskStakeholders(
      task,
      assignedByUser,
      assignedTo,
      watchers,
      assignedTeamId,
      "Created"
    );

    return sendSuccessResponse(res, task, "Task created successfully");
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to create task", err.message);
  }
};

// Get All Tasks with Filters
exports.getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      assignedBy,
      assignedTeamId,
      resourceType,
      resourceId,
      tags,
      isOverdue,
      isArchived = "false",
      search,
      taskBoard, // Add taskBoard filter
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    const filters = { isArchived: isArchived === "true" };

    if (status)
      filters.status = { $in: status.split(",").map((s) => s.toUpperCase()) };
    if (priority)
      filters.priority = {
        $in: priority.split(",").map((p) => p.toLowerCase()),
      };
    if (assignedTo) filters.assignedTo = assignedTo;
    if (assignedBy) filters.assignedBy = assignedBy;
    if (assignedTeamId) filters.assignedTeamId = assignedTeamId;
    if (resourceType && resourceId) {
      filters["linkedResource.resourceType"] = resourceType;
      filters["linkedResource.resourceId"] = resourceId;
    } else if (resourceType) {
      filters["linkedResource.resourceType"] = resourceType;
    }
    if (tags) filters.tags = { $in: tags.split(",") };
    if (isOverdue === "true") {
      filters.dueDate = { $lt: new Date() };
      filters.status = { $nin: ["COMPLETED", "CANCELLED"] };
    }
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { taskId: { $regex: search, $options: "i" } },
      ];
    }
    if (taskBoard) {
      if (!mongoose.isValidObjectId(taskBoard)) {
        return sendErrorResponse(res, 400, "Invalid TaskBoard ID");
      }
      filters.taskBoard = taskBoard;
    }

    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (pageNum - 1) * limitNum;

    const [tasks, totalCount] = await Promise.all([
      Task.find(filters).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Task.countDocuments(filters),
    ]);

    // Fetch user details in bulk (MySQL)
    const userIds = [
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
      tasks: tasksWithUsers,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch tasks", err.message);
  }
};
// Get Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id).populate("dependsOn blockedBy").lean();

    if (!task) return sendErrorResponse(res, 404, "Task not found");

    // Fetch user details (MySQL)
    const [assignedToUser, assignedByUser, watcherDetails] = await Promise.all([
      User.findByPk(task.assignedTo, {
        attributes: ["userId", "username", "name", "email"],
      }),
      User.findByPk(task.assignedBy, {
        attributes: ["userId", "username", "name"],
      }),
      Promise.all(
        (task.watchers || []).map((userId) =>
          User.findByPk(userId, {
            attributes: ["userId", "username", "name"],
          }).then((user) => user?.toJSON())
        )
      ),
    ]);

    return sendSuccessResponse(res, {
      ...task,
      assignedToUser: assignedToUser?.toJSON() || null,
      assignedByUser: assignedByUser?.toJSON() || null,
      watcherDetails: watcherDetails.filter(Boolean),
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch task", err.message);
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    // Validate updates (MySQL for User/Team, MongoDB for Task dependencies)
    if (updates.assignedTo || updates.assignedBy || updates.assignedTeamId) {
      await validateTaskData({ ...updates, title: task.title });
    }

    if (
      updates.linkedResource?.resourceType &&
      updates.linkedResource.resourceId
    ) {
      const resourceValidation = await validateResourceLink(
        updates.linkedResource.resourceType,
        updates.linkedResource.resourceId
      );
      if (!resourceValidation.valid) {
        return sendErrorResponse(res, 404, resourceValidation.error);
      }
    }

    Object.assign(task, updates);
    await task.save();

    // Notify stakeholders
    await notifyTaskStakeholders(
      task,
      { name: "System" },
      task.assignedTo,
      task.watchers,
      task.assignedTeamId,
      "Updated"
    );

    return sendSuccessResponse(res, task, "Task updated successfully");
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to update task", err.message);
  }
};

// Add/Remove Watcher
exports.manageWatcher = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body;

    if (!userId || !["add", "remove"].includes(action)) {
      return sendErrorResponse(
        res,
        400,
        "userId and valid action (add/remove) are required"
      );
    }

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    const user = await User.findByPk(userId, { attributes: ["userId"] });
    if (!user) return sendErrorResponse(res, 404, "User not found");

    if (action === "add" && !task.watchers.includes(userId)) {
      task.watchers.push(userId);
      await sendNotification({
        userId,
        title: `Watching Task: ${task.taskId}`,
        message: `You are now watching task "${task.title}"`,
      });
    } else if (action === "remove") {
      task.watchers = task.watchers.filter((w) => w !== userId);
    }

    await task.save();
    return sendSuccessResponse(res, task, `Watcher ${action}ed successfully`);
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to manage watcher", err.message);
  }
};

// Add Attachment
exports.addAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!req.file) return sendErrorResponse(res, 400, "No file uploaded");
    if (!userId) return sendErrorResponse(res, 400, "userId is required");

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    const { fileUrl, uniqueName } = await uploadToCDN(req.file);
    task.attachments.push({
      filename: uniqueName,
      fileUrl,
      uploadedAt: new Date(),
      uploadedBy: userId,
    });

    await task.save();

    const notificationRecipients = new Set([
      task.assignedTo,
      ...(task.watchers || []),
    ]);
    const notifications = [];
    for (const recipientId of notificationRecipients) {
      if (recipientId !== userId) {
        notifications.push(
          sendNotification({
            userId: recipientId,
            title: `Attachment Added: ${task.taskId}`,
            message: `A new attachment has been added to task "${task.title}"`,
          })
        );
      }
    }
    await Promise.all(notifications);

    return sendSuccessResponse(res, task, "Attachment added successfully");
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to add attachment", err.message);
  }
};

// Other Endpoints
exports.getTaskStats = async (req, res) => {
  try {
    const { userId, teamId, startDate, endDate } = req.query;
    const filters = { isArchived: false };

    if (userId) filters.$or = [{ assignedTo: userId }, { assignedBy: userId }];
    if (teamId) filters.assignedTeamId = teamId;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      criticalTasks,
      highPriorityTasks,
    ] = await Promise.all([
      Task.countDocuments(filters),
      Task.countDocuments({ ...filters, status: "PENDING" }),
      Task.countDocuments({ ...filters, status: "IN_PROGRESS" }),
      Task.countDocuments({ ...filters, status: "COMPLETED" }),
      Task.countDocuments({
        ...filters,
        dueDate: { $lt: new Date() },
        status: { $nin: ["COMPLETED", "CANCELLED"] },
      }),
      Task.countDocuments({ ...filters, priority: "critical" }),
      Task.countDocuments({ ...filters, priority: "high" }),
    ]);

    const stats = {
      total: totalTasks,
      byStatus: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
      },
      overdue: overdueTasks,
      byPriority: { critical: criticalTasks, high: highPriorityTasks },
      completionRate:
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
    };

    return sendSuccessResponse(res, stats);
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch statistics",
      err.message
    );
  }
};

exports.getTasksByResource = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    if (!resourceType || !resourceId) {
      return sendErrorResponse(
        res,
        400,
        "resourceType and resourceId are required"
      );
    }

    const tasks = await Task.find({
      "linkedResource.resourceType": resourceType,
      "linkedResource.resourceId": resourceId,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user details in bulk (MySQL)
    const userIds = [
      ...new Set(tasks.flatMap((task) => [task.assignedTo, task.assignedBy])),
    ];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      assignedToUser: userMap.get(task.assignedTo) || null,
      assignedByUser: userMap.get(task.assignedBy) || null,
    }));

    return sendSuccessResponse(res, {
      tasks: tasksWithUsers,
      totalCount: tasksWithUsers.length,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch tasks by resource",
      err.message
    );
  }
};

exports.bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, updates } = req.body;
    if (!taskIds?.length || !updates) {
      return sendErrorResponse(
        res,
        400,
        "taskIds array and updates object are required"
      );
    }

    const allowedFields = [
      "status",
      "priority",
      "assignedTo",
      "assignedTeamId",
      "tags",
      "dueDate",
    ];
    const invalidFields = Object.keys(updates).filter(
      (field) => !allowedFields.includes(field)
    );
    if (invalidFields.length) {
      return sendErrorResponse(
        res,
        400,
        `Invalid update fields: ${invalidFields.join(", ")}`
      );
    }

    if (updates.status) {
      const validStatuses = [
        "PENDING",
        "IN_PROGRESS",
        "REVIEW",
        "COMPLETED",
        "CANCELLED",
        "ON_HOLD",
      ];
      if (!validStatuses.includes(updates.status.toUpperCase())) {
        return sendErrorResponse(res, 400, `Invalid status: ${updates.status}`);
      }
      updates.status = updates.status.toUpperCase();
    }

    if (updates.priority) {
      const validPriorities = ["critical", "high", "medium", "low"];
      if (!validPriorities.includes(updates.priority.toLowerCase())) {
        return sendErrorResponse(
          res,
          400,
          `Invalid priority: ${updates.priority}`
        );
      }
      updates.priority = updates.priority.toLowerCase();
    }

    if (updates.assignedTo) {
      const user = await User.findByPk(updates.assignedTo, {
        attributes: ["userId"],
      });
      if (!user) return sendErrorResponse(res, 404, "Assigned user not found");
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, isArchived: false },
      { $set: updates }
    );
    const tasks = await Task.find({ _id: { $in: taskIds } }).lean();

    const notifications = tasks.map((task) =>
      [...new Set([task.assignedTo, ...(task.watchers || [])])].map((userId) =>
        sendNotification({
          userId,
          title: `Bulk Update: ${task.taskId}`,
          message: `Task "${task.title}" has been updated`,
        })
      )
    );
    await Promise.all(notifications.flat());

    return sendSuccessResponse(
      res,
      { modifiedCount: result.nModified },
      "Tasks updated successfully"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to bulk update tasks",
      err.message
    );
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, priority, page = 1, limit = 20 } = req.query;

    if (!userId) return sendErrorResponse(res, 400, "userId is required");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filters = { assignedTo: userId, isArchived: false };
    if (status)
      filters.status = { $in: status.split(",").map((s) => s.toUpperCase()) };
    if (priority)
      filters.priority = {
        $in: priority.split(",").map((p) => p.toLowerCase()),
      };

    const [tasks, totalCount] = await Promise.all([
      Task.find(filters)
        .sort({ dueDate: 1, priority: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filters),
    ]);

    return sendSuccessResponse(res, {
      tasks,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch tasks", err.message);
  }
};

exports.getCreatedTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) return sendErrorResponse(res, 400, "userId is required");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [tasks, totalCount] = await Promise.all([
      Task.find({ assignedBy: userId, isArchived: false })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Task.countDocuments({ assignedBy: userId, isArchived: false }),
    ]);

    // Fetch user details in bulk (MySQL)
    const userIds = [...new Set(tasks.map((task) => task.assignedTo))];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      assignedToUser: userMap.get(task.assignedTo) || null,
    }));

    return sendSuccessResponse(res, {
      tasks: tasksWithUsers,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch tasks", err.message);
  }
};

exports.getOverdueTasks = async (req, res) => {
  try {
    const { userId, teamId } = req.query;
    const filters = {
      dueDate: { $lt: new Date() },
      status: { $nin: ["COMPLETED", "CANCELLED"] },
      isArchived: false,
    };

    if (userId) filters.assignedTo = userId;
    if (teamId) filters.assignedTeamId = teamId;

    const tasks = await Task.find(filters).sort({ dueDate: 1 }).lean();

    // Fetch user details in bulk (MySQL)
    const userIds = [...new Set(tasks.map((task) => task.assignedTo))];
    const users = await User.findAll({
      where: { userId: userIds },
      attributes: ["userId", "username", "name"],
    });
    const userMap = new Map(users.map((user) => [user.userId, user.toJSON()]));

    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      assignedToUser: userMap.get(task.assignedTo) || null,
    }));

    return sendSuccessResponse(res, {
      tasks: tasksWithUsers,
      totalCount: tasksWithUsers.length,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch overdue tasks",
      err.message
    );
  }
};

exports.cloneTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedBy, dueDate } = req.body;

    if (!assignedBy)
      return sendErrorResponse(res, 400, "assignedBy is required");

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const originalTask = await Task.findById(id);
    if (!originalTask) return sendErrorResponse(res, 404, "Task not found");

    const clonedTask = await Task.create({
      title: `Copy of ${originalTask.title}`,
      description: originalTask.description,
      assignedTo: assignedTo || originalTask.assignedTo,
      assignedBy,
      assignedTeamId: originalTask.assignedTeamId,
      priority: originalTask.priority,
      status: "PENDING",
      dueDate: dueDate ? new Date(dueDate) : originalTask.dueDate,
      estimatedHours: originalTask.estimatedHours,
      tags: [...originalTask.tags],
      checklist: originalTask.checklist.map((item) => ({
        item: item.item,
        isCompleted: false,
      })),
      linkedResource: originalTask.linkedResource,
    });

    const assignedByUser = await User.findByPk(assignedBy, {
      attributes: ["userId", "name"],
    });
    if (!assignedByUser)
      return sendErrorResponse(res, 404, "Assigner user not found");

    await sendNotification({
      userId: clonedTask.assignedTo,
      title: `Task Cloned: ${clonedTask.taskId}`,
      message: `A cloned task "${clonedTask.title}" has been assigned to you by ${assignedByUser.name}`,
    });

    return res
      .status(201)
      .json({ message: "Task cloned successfully", data: clonedTask });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to clone task", err.message);
  }
};

exports.updateTimeTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualHours } = req.body;

    if (actualHours === undefined || actualHours < 0) {
      return sendErrorResponse(
        res,
        400,
        "actualHours must be a non-negative number"
      );
    }

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    task.actualHours = actualHours;
    await task.save();

    return sendSuccessResponse(res, task, "Time tracking updated successfully");
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to update time tracking",
      err.message
    );
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    const dependentTasks = await Task.find({
      $or: [{ dependsOn: id }, { blockedBy: id }],
    });

    if (dependentTasks.length) {
      return sendErrorResponse(
        res,
        400,
        "Cannot delete task with dependencies. Remove dependencies first."
      );
    }

    const notificationRecipients = new Set([
      task.assignedTo,
      task.assignedBy,
      ...(task.watchers || []),
    ]);
    const notifications = [];
    for (const userId of notificationRecipients) {
      notifications.push(
        sendNotification({
          userId,
          title: `Task Deleted: ${task.taskId}`,
          message: `Task "${task.title}" has been deleted`,
        })
      );
    }
    await Promise.all(notifications);

    await task.remove();
    return sendSuccessResponse(res, null, "Task deleted successfully");
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to delete task", err.message);
  }
};

exports.archiveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive, userId } = req.body;

    if (archive === undefined || !userId) {
      return sendErrorResponse(res, 400, "archive and userId are required");
    }

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    task.isArchived = archive;
    task.archivedAt = archive ? new Date() : null;
    task.archivedBy = archive ? userId : null;
    await task.save();

    return sendSuccessResponse(
      res,
      task,
      archive ? "Task archived successfully" : "Task unarchived successfully"
    );
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to archive task", err.message);
  }
};

exports.updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklistIndex, isCompleted, userId } = req.body;

    if (checklistIndex === undefined || isCompleted === undefined || !userId) {
      return sendErrorResponse(
        res,
        400,
        "checklistIndex, isCompleted, and userId are required"
      );
    }

    if (!mongoose.isValidObjectId(id)) {
      return sendErrorResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(id);
    if (!task) return sendErrorResponse(res, 404, "Task not found");

    if (!task.checklist?.[checklistIndex]) {
      return sendErrorResponse(res, 404, "Checklist item not found");
    }

    task.checklist[checklistIndex].isCompleted = isCompleted;
    task.checklist[checklistIndex].completedAt = isCompleted
      ? new Date()
      : null;
    task.checklist[checklistIndex].completedBy = isCompleted ? userId : null;

    await task.save();
    return sendSuccessResponse(
      res,
      task,
      "Checklist item updated successfully"
    );
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to update checklist item",
      err.message
    );
  }
};
