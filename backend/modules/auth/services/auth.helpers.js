const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Role, RolePermission, Permission } = require("../../../models");
const VerificationToken = require("../models/verification-token.model");
const emails = require("../../../middleware/sendMail");
const ROLES = require("../../../config/constant");
const { ActivityLog } = require("../../../models");
const logActivity = require("../../../utils/activityLogger");
require("dotenv").config();

module.exports = {
  bcrypt,
  jwt,
  Op,
  User,
  Role,
  RolePermission,
  Permission,
  VerificationToken,
  emails,
  ROLES,
  ActivityLog,
  logActivity,
};
