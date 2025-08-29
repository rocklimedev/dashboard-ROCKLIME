const Attendance = require("../models/attendance");
const User = require("../models/users");
const { Op } = require("sequelize");

const clockIn = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate user exists in MySQL
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: today },
    });

    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: "Already clocked in today",
      });
    }

    // Create or update attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { userId, date: { $gte: today } },
      {
        userId,
        status: "present",
        clockIn: new Date(),
        date: today,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Clocked in successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Clock-in error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clock in",
    });
  }
};

const clockOut = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate user exists in MySQL
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find today’s attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: today },
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: "No clock-in record found for today",
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: "Already clocked out today",
      });
    }

    // Update clock-out time
    attendance.clockOut = new Date();
    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Clocked out successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Clock-out error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clock out",
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    // Validate user exists in MySQL
    if (userId) {
      const user = await User.findOne({ where: { userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    }

    // Build query
    const query = {};
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: attendances,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve attendance",
    });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;

    // Build query
    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (status) {
      query.status = status; // Filter by status (absent, present)
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch attendance records
    const attendances = await Attendance.find(query)
      .sort({ date: -1 }) // Newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    // Optionally, fetch user details from MySQL for each attendance record
    const userIds = [...new Set(attendances.map((att) => att.userId))];
    const users = await User.findAll({
      where: { userId: { [Op.in]: userIds } },
      attributes: ["userId", "name", "email"],
    });

    // Map user details to attendance records
    const enrichedAttendances = attendances.map((att) => {
      const user = users.find((u) => u.userId === att.userId);
      return {
        ...att.toObject(),
        user: user
          ? { userId: user.userId, name: user.name, email: user.email }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "All attendance records retrieved successfully",
      data: enrichedAttendances,
      meta: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get all attendance error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve all attendance records",
    });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getAttendance,
  getAllAttendance,
};
