const { Op } = require("sequelize");
const { User, Role, Address } = require("../../../models");
const sequelize = require("../../../config/database");
const bcrypt = require("bcrypt");
const ROLES = require("../../../config/constant").ROLES;
const path = require("path");
const ftp = require("basic-ftp");
const sharp = require("sharp"); // npm i sharp
const { v4: uuidv4 } = require("uuid");
const { Readable } = require("stream");
const logActivity = require("../../../utils/activityLogger");
const { ActivityLog } = require("../../../models");
// Helper function to exclude sensitive fields
const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

function bufferToStream(buffer) {
  return Readable.from(buffer);
}
// Middleware to check if user is authorized (e.g., Admin or SuperAdmin)
const isAdminOrSuperAdmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.userId, excludeSensitiveFields);
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.roles)) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin access required" });
  }
  next();
};

module.exports = {
  Op,
  User,
  Role,
  Address,
  sequelize,
  bcrypt,
  ROLES,
  path,
  ftp,
  sharp,
  uuidv4,
  Readable,
  logActivity,
  ActivityLog,
  excludeSensitiveFields,
  bufferToStream,
  isAdminOrSuperAdmin,
};
