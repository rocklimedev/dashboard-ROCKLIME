const { Quotation, Customer, User } = require("../../../models"); // adjust path
const { buildDateFilter } = require("./report-common.service");
const {
  generateQuotationReportPDF,
  generateQuotationReportExcel,
} = require("../../../utils/reportGenerators");

const getQuotationReport = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "quotation_date",
    });

    const quotations = await Quotation.findAll({
      where: dateFilter,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["quotation_date", "DESC"]],
      limit: parseInt(req.query.limit) || 5000,
    });

    return res.json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    console.error("getQuotationReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation report",
    });
  }
};

const downloadQuotationReportPDF = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "quotation_date",
    });

    const quotations = await Quotation.findAll({
      where: dateFilter,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name", "phone", "email"],
        },
      ],
      order: [["quotation_date", "DESC"]],
    });

    const start = req.query.startDate || null;
    const end = req.query.endDate || null;

    const pdfBuffer = await generateQuotationReportPDF(quotations, start, end);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Quotation_Report_${Date.now()}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadQuotationReportPDF error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Quotation PDF",
    });
  }
};

const downloadQuotationReportExcel = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "quotation_date",
    });

    const quotations = await Quotation.findAll({
      where: dateFilter,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name"],
        },
      ],
      order: [["quotation_date", "DESC"]],
    });

    const excelBuffer = await generateQuotationReportExcel(quotations);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Quotation_Report_${Date.now()}.xlsx`,
    );
    return res.send(excelBuffer);
  } catch (error) {
    console.error("downloadQuotationReportExcel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Quotation Excel",
    });
  }
};

module.exports = {
  getQuotationReport,
  downloadQuotationReportPDF,
  downloadQuotationReportExcel,
};
