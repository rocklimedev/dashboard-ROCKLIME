const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth"); // Authentication Middleware
const userController = require("../controller/userController");
const checkPermission = require("../middleware/permission");
const multer = require("multer");
router.use(auth);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."));
    }
  },
});
// ✅ General User Routes (For All Logged-in Users)
router.get(
  "/me",
  auth,
  // checkPermission("view", "get_profile", "users", "/users/me"),
  userController.getProfile,
); // Get logged-in user's profile
router.put(
  "/",
  auth,
  //checkPermission("edit", "update_profile", "users", "/users"),
  userController.updateProfile,
); // edit logged-in user's profile

// ✅ Admin-Only Routes
router.get(
  "/",
  auth,
  // checkPermission("view", "get_all_users", "users", "/users"),
  //role([ROLES.Admin]),
  userController.getAllUsers,
); // View all users
router.post(
  "/add",
  auth,
  //checkPermission("write", "create_user", "users", "/users/add"),
  userController.createUser,
); // Add a new user
router.delete(
  "/:userId",
  auth,
  //  checkPermission("delete", "delete_user", "users", "/users/:userId"),
  userController.deleteUser,
); // Delete a user
router.put(
  "/:userId",
  auth,
  //checkPermission("edit", "update_user", "users", "/users/:userId"),
  userController.updateUser,
);
// ✅ Admin & Moderator Routes
router.get(
  "/search",
  auth,
  // checkPermission("view", "search_user", "users", "/users/search"),
  userController.searchUser,
);
router.get(
  "/:userId",
  auth,
  //checkPermission("view", "get_user_by_id", "users", "/users/:userId"),
  userController.getUserById,
);

// ✅ Public Reporting Route (Any Logged-in User)
router.post(
  "/report/:userId",
  auth,
  //checkPermission("post", "report_user", "users", "/users/report/:userId"),
  userController.reportUser,
);
router.put(
  "/assign-role/:userId",
  //checkPermission("edit", "assign_role", "users", "/users/assign-role/:userId"),
  userController.assignRole,
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
  userController.changeStatusToInactive,
);
router.patch("/:userId/status", auth, userController.updateStatus);
router.post(
  "/photo",
  auth,
  upload.single("photo"), // 'photo' is the field name in FormData
  userController.uploadUserPhoto,
);
module.exports = router;
