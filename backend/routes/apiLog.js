const express = require("express");
const router = express.Router();
const ApiLog = require("../models/apiLog");

// GET /api/logs - Fetch logs with filtering, sorting, and pagination
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      method,
      route,
      user,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};
    if (method) query.method = method.toUpperCase();
    if (route) query.route = { $regex: route, $options: "i" };
    if (user) query["user.id"] = user;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const logs = await ApiLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await ApiLog.countDocuments(query);

    res.json({
      logs,
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

// GET /api/logs/:id - Fetch a single log by ID
router.get("/:id", async (req, res, next) => {
  try {
    const log = await ApiLog.findById(req.params.id).lean();
    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }
    res.json(log);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/logs/:id - Delete a single log by ID
router.delete("/:id", async (req, res, next) => {
  try {
    const log = await ApiLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }
    res.json({ message: "Log deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/logs - Bulk delete logs based on filters
router.delete("/", async (req, res, next) => {
  try {
    const { method, route, user, startDate, endDate } = req.query;

    const query = {};
    if (method) query.method = method.toUpperCase();
    if (route) query.route = { $regex: route, $options: "i" };
    if (user) query["user.id"] = user;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const result = await ApiLog.deleteMany(query);
    res.json({
      message: `${result.deletedCount} logs deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/logs/stats - Get summary statistics of logs
router.get("/stats", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await ApiLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          methods: {
            $push: "$method",
          },
          avgDuration: { $avg: "$duration" },
          statusCodes: {
            $push: "$status",
          },
        },
      },
      {
        $project: {
          totalRequests: 1,
          methodBreakdown: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$methods"] },
                as: "method",
                in: [
                  "$$method",
                  {
                    $size: {
                      $filter: {
                        input: "$methods",
                        as: "m",
                        cond: { $eq: ["$$m", "$$method"] },
                      },
                    },
                  },
                ],
              },
            },
          },
          avgDuration: { $round: ["$avgDuration", 2] },
          statusBreakdown: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$statusCodes"] },
                as: "status",
                in: [
                  { $toString: "$$status" },
                  {
                    $size: {
                      $filter: {
                        input: "$statusCodes",
                        as: "s",
                        cond: { $eq: ["$$s", "$$status"] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    res.json(
      stats[0] || {
        totalRequests: 0,
        methodBreakdown: {},
        avgDuration: 0,
        statusBreakdown: {},
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
