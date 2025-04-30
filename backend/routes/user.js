const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth"); // Authentication Middleware
const role = require("../middleware/role").check; // Role-Based Access Control Middleware
const userController = require("../controller/userController");
const { ROLES } = require("../config/constant");
const checkPermission = require("../middleware/permission");
// ✅ General User Routes (For All Logged-in Users)
router.get(
  "/me",
  auth,
  // checkPermission("view", "get_profile", "users", "/users/me"),
  userController.getProfile
); // Get logged-in user's profile
router.put(
  "/",
  auth,
  //checkPermission("edit", "update_profile", "users", "/users"),
  userController.updateProfile
); // edit logged-in user's profile

// ✅ Admin-Only Routes
router.get(
  "/",
  auth,
  // checkPermission("view", "get_all_users", "users", "/users"),
  //role([ROLES.Admin]),
  userController.getAllUsers
); // View all users
router.post(
  "/add",
  auth,
  //checkPermission("write", "create_user", "users", "/users/add"),
  // role([ROLES.Admin]),
  userController.createUser
); // Add a new user
router.delete(
  "/:userId",
  auth,
  //  checkPermission("delete", "delete_user", "users", "/users/:userId"),
  // role([ROLES.Admin]),
  userController.deleteUser
); // Delete a user
router.put(
  "/:userId",
  auth,
  //checkPermission("edit", "update_user", "users", "/users/:userId"),
  userController.updateUser
);
// ✅ Admin & Moderator Routes
router.get(
  "/search",
  auth,
  //  role([ROLES.Admin, ROLES.SALES]),
  // checkPermission("view", "search_user", "users", "/users/search"),
  userController.searchUser
);
router.get(
  "/:userId",
  auth,
  // role([ROLES.Admin, ROLES.SALES]),
  //checkPermission("view", "get_user_by_id", "users", "/users/:userId"),
  userController.getUserById
);

// ✅ Public Reporting Route (Any Logged-in User)
router.post(
  "/report/:userId",
  auth,
  //checkPermission("post", "report_user", "users", "/users/report/:userId"),
  userController.reportUser
);
router.put(
  "/assign-role/:userId",
  //checkPermission("edit", "assign_role", "users", "/users/assign-role/:userId"),
  userController.assignRole
);
router.put(
  "/:userId",
  auth,
  // checkPermission(
  //   "edit",
  //   "change_status_to_inactive",
  //   "users",
  //   "/users/:userId"
  // ),
  userController.changeStatusToInactive
);
module.exports = router;
