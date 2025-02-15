const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const role = require("../middleware/role");
const userController = require("../controller/userController");
const { ROLES } = require("../config/constant");

// General user routes
router.get("/me", auth, userController.getProfile); // Get current user's profile
router.put("/", auth, userController.updateProfile); // Update current user's profile
router.get("/", auth, userController.getAllUsers);

// Admin-specific routes
router.get("/search", auth, userController.searchUser);
router.get("/:userId", auth, userController.getUserById);
// router.put("/:userId", auth, userController.updateUser);
router.delete("/:userId", auth, userController.deleteUser);
router.post("/report/:userId", auth, userController.reportUser);
module.exports = router;
