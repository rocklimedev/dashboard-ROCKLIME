const { Order, Customer, User } = require("../../../models"); // adjust path
const { buildDateFilter } = require("./report-common.service");
const {
  generateOrderReportPDF,
  generateOrderReportExcel,
} = require("../../../utils/reportGenerators");
const getOrderReport = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "createdAt",
    });

    const orders = await Order.findAll({
      where: dateFilter,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "phone"],
        },
        { model: User, as: "creator", attributes: ["id", "name"] },
        { model: User, as: "assignedUser", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(req.query.limit) || 5000,
    });

    return res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("getOrderReport error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch order report" });
  }
};

const downloadOrderReportPDF = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "createdAt",
    });

    const orders = await Order.findAll({
      where: dateFilter,
      include: [
        { model: Customer, as: "customer", attributes: ["name", "phone"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const start = req.query.startDate || null;
    const end = req.query.endDate || null;

    const pdfBuffer = await generateOrderReportPDF(orders, start, end);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Order_Report_${Date.now()}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadOrderReportPDF error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate PDF" });
  }
};

const downloadOrderReportExcel = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "createdAt",
    });

    const orders = await Order.findAll({
      where: dateFilter,
      include: [{ model: Customer, as: "customer", attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });

    const excelBuffer = await generateOrderReportExcel(orders);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Order_Report_${Date.now()}.xlsx`,
    );
    return res.send(excelBuffer);
  } catch (error) {
    console.error("downloadOrderReportExcel error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate Excel" });
  }
};

module.exports = {
  getOrderReport,
  downloadOrderReportPDF,
  downloadOrderReportExcel,
};
