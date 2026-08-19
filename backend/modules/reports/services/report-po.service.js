const { PurchaseOrder, Vendor, User } = require("../../../models"); // adjust model names
const { buildDateFilter } = require("./report-common.service");
const {
  generatePOReportPDF,
  generatePOReportExcel,
} = require("../../../utils/reportGenerators");

const getPOReport = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "orderDate", // change if your field is different (e.g. createdAt)
    });

    const purchaseOrders = await PurchaseOrder.findAll({
      where: dateFilter,
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["orderDate", "DESC"]],
      limit: parseInt(req.query.limit) || 5000,
    });

    return res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders,
    });
  } catch (error) {
    console.error("getPOReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Purchase Order report",
    });
  }
};

const downloadPOReportPDF = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "orderDate",
    });

    const purchaseOrders = await PurchaseOrder.findAll({
      where: dateFilter,
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["name", "phone"],
        },
      ],
      order: [["orderDate", "DESC"]],
    });

    const start = req.query.startDate || null;
    const end = req.query.endDate || null;

    const pdfBuffer = await generatePOReportPDF(purchaseOrders, start, end);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=PO_Report_${Date.now()}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadPOReportPDF error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate PO PDF",
    });
  }
};

const downloadPOReportExcel = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "orderDate",
    });

    const purchaseOrders = await PurchaseOrder.findAll({
      where: dateFilter,
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["name"],
        },
      ],
      order: [["orderDate", "DESC"]],
    });

    const excelBuffer = await generatePOReportExcel(purchaseOrders);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=PO_Report_${Date.now()}.xlsx`,
    );
    return res.send(excelBuffer);
  } catch (error) {
    console.error("downloadPOReportExcel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate PO Excel",
    });
  }
};

module.exports = {
  getPOReport,
  downloadPOReportPDF,
  downloadPOReportExcel,
};
