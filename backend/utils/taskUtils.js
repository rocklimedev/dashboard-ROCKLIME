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
const { Op } = require("sequelize");
const TeamMember = require("../models/teamMember");

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

async function validateTaskData({
  title,
  assignedTo,
  assignedBy,
  assignedTeamId,
  secondaryAssignedTo,
  priority,
  status,
  dueDate,
  startDate,
  watchers = [],
  dependsOn = [],
  taskBoard,
}) {
  const errors = [];

  // Validate title
  if (!title?.trim()) {
    errors.push("Title is required");
  }

  // Validate assignedTo (userId from MySQL)
  let assignedToUser = null;
  if (assignedTo) {
    assignedToUser = await User.findByPk(assignedTo, {
      attributes: ["userId", "username", "name", "email"],
    });
    if (!assignedToUser) {
      errors.push("Assigned user not found");
    }
  } else {
    errors.push("assignedTo is required");
  }

  // Validate assignedBy (userId from MySQL)
  let assignedByUser = null;
  if (assignedBy) {
    assignedByUser = await User.findByPk(assignedBy, {
      attributes: ["userId", "username", "name", "email"],
    });
    if (!assignedByUser) {
      errors.push("Assigned by user not found");
    }
  } else {
    errors.push("assignedBy is required");
  }

  // Validate secondaryAssignedTo (if provided)
  let secondaryAssignedToUser = null;
  if (secondaryAssignedTo) {
    secondaryAssignedToUser = await User.findByPk(secondaryAssignedTo, {
      attributes: ["userId", "username", "name", "email"],
    });
    if (!secondaryAssignedToUser) {
      errors.push("Secondary assigned user not found");
    }
  }

  // Validate team assignment
  if (assignedTeamId) {
    // Fetch team members in a single query for efficiency
    const teamMembers = await TeamMember.findAll({
      where: { teamId: assignedTeamId },
      attributes: ["userId"],
    });
    const teamMemberIds = teamMembers.map((tm) => tm.userId);

    // Check assignedTo
    if (!teamMemberIds.includes(assignedTo)) {
      errors.push(
        `User ${assignedTo} is not a member of team ${assignedTeamId}`
      );
    }

    // Check secondaryAssignedTo (if provided)
    if (secondaryAssignedTo && !teamMemberIds.includes(secondaryAssignedTo)) {
      errors.push(
        `Secondary user ${secondaryAssignedTo} is not a member of team ${assignedTeamId}`
      );
    }

    // Optional: Restrict watchers to team members
    if (watchers.length) {
      const invalidWatchers = watchers.filter(
        (w) => !teamMemberIds.includes(w)
      );
      if (invalidWatchers.length) {
        errors.push(
          `Watchers ${invalidWatchers.join(
            ", "
          )} are not members of team ${assignedTeamId}`
        );
      }
    }
  } else {
    // No team: Ensure only two assignees (assignedTo and secondaryAssignedTo)
    const assignees = [assignedTo, secondaryAssignedTo].filter(Boolean);
    if (assignees.length > 2) {
      errors.push(
        "Cannot assign more than two users when no team is specified"
      );
    }
  }

  // Validate priority
  const validPriorities = ["critical", "high", "medium", "low"];
  if (priority && !validPriorities.includes(priority.toLowerCase())) {
    errors.push(`Invalid priority: ${priority}`);
  }

  // Validate status
  const validStatuses = [
    "PENDING",
    "IN_PROGRESS",
    "REVIEW",
    "COMPLETED",
    "CANCELLED",
    "ON_HOLD",
  ];
  if (status && !validStatuses.includes(status.toUpperCase())) {
    errors.push(`Invalid status: ${status}`);
  }

  // Validate dueDate and startDate
  if (dueDate && isNaN(new Date(dueDate).getTime())) {
    errors.push("Invalid dueDate");
  }
  if (startDate && isNaN(new Date(startDate).getTime())) {
    errors.push("Invalid startDate");
  }

  // Validate watchers (userIds from MySQL)
  if (watchers.length) {
    const validWatchers = await User.findAll({
      where: { userId: { [Op.in]: watchers } },
      attributes: ["userId"],
    });
    if (validWatchers.length !== watchers.length) {
      errors.push("One or more watchers not found");
    }
  }

  // Validate dependsOn (task IDs from MongoDB)
  if (dependsOn.length) {
    const validDependsOn = await Task.find({
      _id: { $in: dependsOn },
      isArchived: false,
    });
    if (validDependsOn.length !== dependsOn.length) {
      errors.push("One or more dependent tasks not found or archived");
    }
  }

  // Validate taskBoard (MongoDB)
  let taskBoardDoc = null;
  if (taskBoard) {
    if (!mongoose.isValidObjectId(taskBoard)) {
      errors.push("Invalid TaskBoard ID");
    } else {
      taskBoardDoc = await TaskBoard.findById(taskBoard);
      if (!taskBoardDoc) {
        errors.push("TaskBoard not found");
      } else if (taskBoardDoc.isArchived) {
        errors.push("Cannot assign task to an archived TaskBoard");
      }
    }
  } else {
    errors.push("taskBoard is required");
  }

  if (errors.length) {
    throw new Error(errors.join("; "));
  }

  return {
    assignedToUser: assignedToUser?.toJSON() || null,
    assignedByUser: assignedByUser?.toJSON() || null,
    secondaryAssignedToUser: secondaryAssignedToUser?.toJSON() || null,
    taskBoard: taskBoardDoc,
  };
}

// Notify task stakeholders
async function notifyTaskStakeholders(
  task,
  assignedByUser,
  assignedTo,
  watchers,
  assignedTeamId,
  action
) {
  const notificationRecipients = new Set([
    assignedTo,
    task.secondaryAssignedTo,
    ...(watchers || []),
  ]).filter(Boolean);
  const notifications = [];
  for (const userId of notificationRecipients) {
    notifications.push(
      sendNotification({
        userId,
        title: `Task ${action}: ${task.taskId}`,
        message: `Task "${task.title}" has been ${action.toLowerCase()}${
          userId === assignedTo
            ? " (primary assignee)"
            : userId === task.secondaryAssignedTo
            ? " (secondary assignee)"
            : " (watcher)"
        }`,
      })
    );
  }
  await Promise.all(notifications);
}
module.exports = {
  uploadToCDN,
  validateResourceLink,
  sendErrorResponse,
  sendSuccessResponse,
  validateTaskData,
  validateTaskBoard,
  notifyTaskStakeholders,
};
