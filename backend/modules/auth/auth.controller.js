// controllers/authController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const core = require("./services/auth-core.service");
const password = require("./services/auth-password.service");
const permissions = require("./services/auth-permissions.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // Core auth
  login: core.login,
  register: core.register,
  logout: core.logout,
  refreshToken: core.refreshToken,
  validateToken: core.validateToken,

  // Password / verification
  verifyAccount: password.verifyAccount,
  forgotPassword: password.forgotPassword,
  resetPassword: password.resetPassword,
  validateResetToken: password.validateResetToken,
  resendVerificationEmail: password.resendVerificationEmail,
  changePassword: password.changePassword,
  deactivateAccount: password.deactivateAccount,

  // Permissions
  getAllPermissionsOfLoggedInUser: permissions.getAllPermissionsOfLoggedInUser,
};
