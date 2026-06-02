// utils/activityLogger.js

const { ActivityLog } = require("../models");

const logActivity = async ({
  userId,
  contextTag,
  subContext,
  action,
  entityId = null,
  entityName = null,
  description = null,
  oldValues = null,
  newValues = null,
  metadata = null,
  req = null,
}) => {
  try {
    await ActivityLog.create({
      userId,
      contextTag,
      subContext,
      action,
      entityId,
      entityName,
      description,
      oldValues,
      newValues,
      metadata,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.["user-agent"] || null,
    });
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
};

module.exports = logActivity;
