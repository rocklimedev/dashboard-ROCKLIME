const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth"); // Authentication Middleware
const role = require("../middleware/role").check; // Role-Based Access Control Middleware
const userController = require("../controller/userController");
const { ROLES } = require("../config/constant");

// ✅ General User Routes (For All Logged-in Users)
router.get("/me", auth, userController.getProfile); // Get logged-in user's profile
router.put("/", auth, userController.updateProfile); // edit logged-in user's profile

// ✅ Admin-Only Routes
router.get("/", auth, role([ROLES.Admin]), userController.getAllUsers); // View all users
router.post("/add", auth, role([ROLES.Admin]), userController.createUser); // Add a new user
router.delete("/:userId", auth, role([ROLES.Admin]), userController.deleteUser); // Delete a user
router.put("/:userId", auth, userController.updateUser);
// ✅ Admin & Moderator Routes
router.get(
  "/search",
  auth,
  //  role([ROLES.Admin, ROLES.SALES]),
  userController.searchUser
);
router.get(
  "/:userId",
  auth,
  // role([ROLES.Admin, ROLES.SALES]),
  userController.getUserById
);

// ✅ Public Reporting Route (Any Logged-in User)
router.post("/report/:userId", auth, userController.reportUser);
router.put("/assign-role/:userId", userController.assignRole);
router.put("/:userId", auth, userController.changeStatusToInactive);
module.exports = router;
