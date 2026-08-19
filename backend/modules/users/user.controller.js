// controllers/userController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const crud = require("./services/user-crud.service");
const profile = require("./services/user-profile.service");
const admin = require("./services/user-admin.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // CRUD
  createUser: crud.createUser,
  searchUser: crud.searchUser,
  deleteUser: crud.deleteUser,
  getAllUsers: crud.getAllUsers,
  getUserById: crud.getUserById,
  updateUser: crud.updateUser,

  // Profile
  getProfile: profile.getProfile,
  updateProfile: profile.updateProfile,
  uploadUserPhoto: profile.uploadUserPhoto,

  // Admin actions
  reportUser: admin.reportUser,
  changeStatusToInactive: admin.changeStatusToInactive,
  assignRole: admin.assignRole,
  updateStatus: admin.updateStatus,
};
