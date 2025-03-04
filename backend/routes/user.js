const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const role = require("../middleware/role");
const userController = require("../controller/userController");
const { ROLES } = require("../config/constant");

// General user routes
router.get("/me", userController.getProfile); // Get current user's profile
router.put("/", userController.updateProfile); // Update current user's profile
router.get("/", userController.getAllUsers);

// Admin-specific routes
router.get("/search", userController.searchUser);
router.get("/:userId", userController.getUserById);
// router.put("/:userId", userController.updateUser);
router.delete("/:userId", userController.deleteUser);
router.post("/report/:userId", userController.reportUser);
module.exports = router;
