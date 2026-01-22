const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const { auth } = require("../middleware/auth");
router.use(auth);
router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);
router.get("/", attendanceController.getAttendance);
router.get("/all", attendanceController.getAllAttendance); // New endpoint

module.exports = router;
