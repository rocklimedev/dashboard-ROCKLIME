const { Op } = require("sequelize");
const { Order, Quotation, Product, PurchaseOrder } = require("../../../models"); // adjust path

/**
 * Build date filter for Sequelize
 * Supports: all | today | yesterday | last7 | last30 | last3m | last6m | custom range
 */
const buildDateFilter = (query = {}) => {
  const {
    quickFilter = "all",
    startDate,
    endDate,
    dateField = "createdAt",
  } = query;

  const now = new Date();
  let start = null;
  let end = new Date();

  if (quickFilter !== "all") {
    switch (quickFilter) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "yesterday":
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case "last7":
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case "last30":
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
      case "last3m":
        start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        break;
      case "last6m":
        start = new Date(now);
        start.setMonth(start.getMonth() - 6);
        break;
      default:
        break;
    }
  } else if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  if (!start) return {}; // all time

  return {
    [dateField]: {
      [Op.between]: [start, end],
    },
  };
};

/**
 * Get high-level stats for the Reports dashboard
 */
const getReportStats = async (req, res) => {
  try {
    const [totalOrders, totalQuotations, totalPOs, lowStockCount] =
      await Promise.all([
        Order.count(),
        Quotation.count(),
        PurchaseOrder.count(), // adjust model name if different
        Product.count({
          where: {
            quantity: { [Op.lte]: 20 }, // same threshold you use
            status: { [Op.ne]: "inactive" },
          },
        }),
      ]);

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalQuotations,
        totalPOs,
        lowStock: lowStockCount,
      },
    });
  } catch (error) {
    console.error("getReportStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch report stats" });
  }
};

module.exports = {
  buildDateFilter,
  getReportStats,
};
