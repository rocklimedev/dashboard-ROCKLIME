const express = require("express");
const router = express.Router();
const ApiLog = require("../models/apiLog");

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

module.exports = router;
