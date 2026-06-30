const { ActivityLog, User } = require("../models");

exports.getAllActivities = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await ActivityLog.findAndCountAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userId", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      total: count,
      page,
      activities: rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activity logs",
      error: error.message,
    });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await ActivityLog.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userId", "name", "email"],
        },
      ],
    });

    if (!activity) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }

    return res.status(200).json(activity);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activity",
      error: error.message,
    });
  }
};

exports.getActivityByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await ActivityLog.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userId", "name", "email"],
        },
      ],
    });

    return res.status(200).json(activities);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user activities",
      error: error.message,
    });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    const activity = await ActivityLog.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({
        message: "Activity log not found",
      });
    }

    await activity.destroy();

    return res.status(200).json({
      message: "Activity log deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete activity log",
      error: error.message,
    });
  }
};
