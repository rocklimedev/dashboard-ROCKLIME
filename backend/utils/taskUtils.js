const ftp = require("basic-ftp");
const { Readable } = require("stream");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sanitizeHtml = require("sanitize-html");
const User = require("../models/users");
const Team = require("../models/team");
const Task = require("../models/tasks");
const { sendNotification } = require("../controller/notificationController");
const TaskBoard = require("../models/taskBoard");

require("dotenv").config();

// Convert buffer to stream for FTP upload
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

// Upload file to CDN
const uploadToCDN = async (file, folder = "task_attachments") => {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
    });

    const uploadDir = `/${folder}`;
    await client.ensureDir(uploadDir);
    await client.cd(uploadDir);

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    await client.uploadFrom(bufferToStream(file.buffer), uniqueName);

    return {
      fileUrl: `${process.env.FTP_BASE_URL}/${folder}/${uniqueName}`,
      uniqueName,
    };
  } finally {
    client.close();
  }
};

// Validate resource link (MySQL models)
const validateResourceLink = async (resourceType, resourceId) => {
  const resourceModels = {
    Order: require("../models/orders"),
    Customer: require("../models/customers"),
    Product: require("../models/product"),
    Quotation: require("../models/quotation"),
    Invoice: require("../models/invoice"),
  };

  if (!resourceType || !resourceId) return { valid: true }; // Optional linking
  const Model = resourceModels[resourceType];
  if (!Model)
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };

  const resource = await Model.findByPk(resourceId, { attributes: ["id"] }); // Minimal fields
  if (!resource)
    return {
      valid: false,
      error: `${resourceType} with ID ${resourceId} not found`,
    };

  return { valid: true, resource };
};

// Send error response
const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

// Send success response
const sendSuccessResponse = (res, data, message = "Success") => {
  return res.status(200).json({ message, data });
};

const validateTaskBoard = async (taskBoardId) => {
  if (!taskBoardId) return { valid: true }; // TaskBoard is optional
  if (!mongoose.isValidObjectId(taskBoardId)) {
    return { valid: false, error: "Invalid TaskBoard ID" };
  }
  const taskBoard = await TaskBoard.findById(taskBoardId);
  if (!taskBoard) {
    return { valid: false, error: "TaskBoard not found" };
  }
  return { valid: true, taskBoard };
};
// Validate task data (MySQL for User/Team, MongoDB for Task dependencies)
const validateTaskData = async ({
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
  taskBoard, // Add taskBoard parameter
}) => {
  if (!title?.trim()) {
    throw new Error("Title is required");
  }

  const [assignedToUser, assignedByUser, taskBoardValidation] =
    await Promise.all([
      User.findByPk(assignedTo, { attributes: ["userId"] }),
      User.findByPk(assignedBy, { attributes: ["userId"] }),
      validateTaskBoard(taskBoard),
    ]);

  if (!assignedToUser) throw new Error("Assigned user not found");
  if (!assignedByUser) throw new Error("Assigner user not found");
  if (taskBoard && !taskBoardValidation.valid) {
    throw new Error(taskBoardValidation.error);
  }

  // Existing validations for priority, status, etc.
  const validPriorities = ["critical", "high", "medium", "low"];
  if (priority && !validPriorities.includes(priority.toLowerCase())) {
    throw new Error(`Invalid priority: ${priority}`);
  }

  const validStatuses = [
    "PENDING",
    "IN_PROGRESS",
    "REVIEW",
    "COMPLETED",
    "CANCELLED",
    "ON_HOLD",
  ];
  if (status && !validStatuses.includes(status.toUpperCase())) {
    throw new Error(`Invalid status: ${status}`);
  }

  if (dueDate && isNaN(new Date(dueDate).getTime())) {
    throw new Error("Invalid due date");
  }
  if (startDate && isNaN(new Date(startDate).getTime())) {
    throw new Error("Invalid start date");
  }

  return {
    assignedToUser,
    assignedByUser,
    taskBoard: taskBoardValidation.taskBoard,
  };
};

// Notify task stakeholders
const notifyTaskStakeholders = async (
  task,
  assignedByUser,
  assignedTo,
  watchers,
  assignedTeamId,
  action
) => {
  const notifications = [];
  const recipients = new Set([assignedTo, ...(watchers || [])]);

  // If task is part of a TaskBoard, notify the TaskBoard owner
  if (task.taskBoard) {
    const taskBoard = await TaskBoard.findById(task.taskBoard);
    if (taskBoard && taskBoard.owner) {
      recipients.add(taskBoard.owner);
    }
  }

  for (const userId of recipients) {
    if (userId !== assignedByUser.userId) {
      notifications.push(
        sendNotification({
          userId,
          title: `Task ${action}: ${task.taskId}`,
          message: `Task "${task.title}" has been ${action.toLowerCase()}${
            task.taskBoard ? ` in TaskBoard ${task.taskBoard}` : ""
          }`,
        })
      );
    }
  }
  await Promise.all(notifications);
};
module.exports = {
  uploadToCDN,
  validateResourceLink,
  sendErrorResponse,
  sendSuccessResponse,
  validateTaskData,
  validateTaskBoard,
  notifyTaskStakeholders,
};
