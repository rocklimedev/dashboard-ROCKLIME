const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const activityController = require("../controller/activityController");

router.use(auth);

router.get("/", activityController.getAllActivities);

router.get("/user/:userId", activityController.getActivityByUser);

router.get("/:id", activityController.getActivityById);

router.delete("/:id", activityController.deleteLog);

module.exports = router;
