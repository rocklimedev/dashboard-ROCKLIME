// routes/logRoutes.js
const express = require("express");
const router = express.Router();
const ApiLog = require("../models/apiLog");
const { User } = require("../models/users"); // Sequelize MySQL User
const { auth } = require("../middleware/auth");
router.use(auth);
// Helper: Build MongoDB query from request
const buildQuery = (queryParams) => {
  const { method, route, status, userId, search, startDate, endDate } =
    queryParams;

  const mongoQuery = {};

  if (method) mongoQuery.method = method.toUpperCase();
  if (route) mongoQuery.route = { $regex: route, $options: "i" };
  if (status) mongoQuery.status = parseInt(status);
  if (userId) mongoQuery.userId = userId;

  if (search) {
    mongoQuery.$text = { $search: search };
  }

  if (startDate || endDate) {
    mongoQuery.createdAt = {};
    if (startDate) mongoQuery.createdAt.$gte = new Date(startDate);
    if (endDate) mongoQuery.createdAt.$lte = new Date(endDate);
  }

  return mongoQuery;
};

// GET /api/logs - Paginated + Search + Populate user
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      method,
      route,
      userId,
      status,
      search,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const mongoQuery = buildQuery({
      method,
      route,
      userId,
      status,
      search,
      startDate,
      endDate,
    });

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Fetch logs
    const logs = await ApiLog.find(mongoQuery)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Extract unique userIds
    const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))];

    // Fetch real users from MySQL (only if needed)
    let userMap = {};
    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { userId: userIds },
        attributes: ["userId", "name", "email", "username"],
      });

      userMap = Object.fromEntries(
        users.map((u) => [
          u.userId,
          {
            name: u.name || u.username || "Unknown",
            email: u.email,
          },
        ]),
      );
    }

    // Enrich logs: prefer live user > snapshot > null
    const enrichedLogs = logs.map((log) => {
      const liveUser = log.userId ? userMap[log.userId] : null;
      const displayUser = liveUser || log.userSnapshot;

      return {
        ...log,
        user: displayUser
          ? {
              id: log.userId || null,
              name: displayUser.name,
              email: displayUser.email,
            }
          : null,
      };
    });

    const total = await ApiLog.countDocuments(mongoQuery);

    res.json({
      logs: enrichedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});
// GET /api/logs/stats
router.get("/stats", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate && !endDate) {
      // Last 30 days — use pre-aggregated
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await LogStatsDaily.find({
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 });

      const total = dailyStats.reduce((sum, s) => sum + s.totalRequests, 0);
      const avgDuration =
        dailyStats.reduce(
          (sum, s) => sum + s.avgDuration * s.totalRequests,
          0,
        ) / total || 0;

      res.json({
        totalRequests: total,
        avgDuration: Math.round(avgDuration),
        errorRate:
          dailyStats.reduce(
            (sum, s) => sum + s.errorRate * s.totalRequests,
            0,
          ) / total || 0,
        methodBreakdown: Object.keys(
          dailyStats[0]?.methodBreakdown || {},
        ).reduce((acc, k) => {
          acc[k] = dailyStats.reduce(
            (sum, s) => sum + (s.methodBreakdown[k] || 0),
            0,
          );
          return acc;
        }, {}),
        statusBreakdown: Object.keys(
          dailyStats[0]?.statusBreakdown || {},
        ).reduce((acc, k) => {
          acc[k] = dailyStats.reduce(
            (sum, s) => sum + (s.statusBreakdown[k] || 0),
            0,
          );
          return acc;
        }, {}),
      });
    } else {
      // Custom range → fallback to live aggregation with timeout
      // (use the fixed version from above)
    }
  } catch (error) {
    res.json({
      totalRequests: 0,
      avgDuration: 0,
      errorRate: 0,
      methodBreakdown: {},
      statusBreakdown: {},
    });
  }
});

// GET /api/logs/:id
router.get("/:id", async (req, res, next) => {
  try {
    const log = await ApiLog.findById(req.params.id).lean();
    if (!log) return res.status(404).json({ message: "Log not found" });

    // Optionally enrich single log with live user
    if (log.userId) {
      const user = await User.findOne({
        where: { userId: log.userId },
        attributes: ["name", "email"],
      });
      if (user) {
        log.user = {
          id: log.userId,
          name: user.name || user.username,
          email: user.email,
        };
      } else {
        log.user = log.userSnapshot
          ? {
              id: log.userId,
              ...log.userSnapshot,
            }
          : null;
      }
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/logs/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await ApiLog.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Log deleted" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/logs (bulk)
router.delete("/", async (req, res, next) => {
  try {
    const mongoQuery = buildQuery(req.query);
    const result = await ApiLog.deleteMany(mongoQuery);
    res.json({ message: `${result.deletedCount} logs deleted` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
