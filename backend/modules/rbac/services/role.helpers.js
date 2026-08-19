const { v4: uuidv4 } = require("uuid");
const { ROLES } = require("../../../config/constant");
const { Op } = require("sequelize");
const { User, Permission, Role, RolePermission } = require("../../../models");
const { ActivityLog } = require("../../../models");
const logActivity = require("../../../utils/activityLogger");

module.exports = {
  uuidv4,
  ROLES,
  Op,
  User,
  Permission,
  Role,
  RolePermission,
  ActivityLog,
  logActivity,
};
