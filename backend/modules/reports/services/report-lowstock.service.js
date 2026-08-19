const { Product, Brand, Category } = require("../../../models");
const {
  generateLowStockReportPDF,
  generateLowStockReportExcel,
} = require("../../../utils/reportGenerators");
const { Op } = require("sequelize");

const getLowStockReport = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 20;

    const products = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
        status: { [Op.ne]: "inactive" }, // optional
      },
      include: [
        { model: Brand, as: "brand", attributes: ["id", "name"] },
        { model: Category, as: "categories", attributes: ["id", "name"] },
      ],
      order: [["quantity", "ASC"]],
      limit: parseInt(req.query.limit) || 100000,
    });

    return res.json({
      success: true,
      count: products.length,
      threshold,
      data: products,
    });
  } catch (error) {
    console.error("getLowStockReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch low stock report",
    });
  }
};

const downloadLowStockReportPDF = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 20;

    const products = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
        status: { [Op.ne]: "inactive" },
      },
      include: [
        { model: Brand, as: "brand", attributes: ["name"] },
        { model: Category, as: "categories", attributes: ["name"] },
      ],
      order: [["quantity", "ASC"]],
    });

    const pdfBuffer = await generateLowStockReportPDF(products, threshold);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Low_Stock_Report_${Date.now()}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadLowStockReportPDF error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Low Stock PDF",
    });
  }
};

const downloadLowStockReportExcel = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 20;

    const products = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
        status: { [Op.ne]: "inactive" },
      },
      include: [
        { model: Brand, as: "brand", attributes: ["name"] },
        { model: Category, as: "categories", attributes: ["name"] },
      ],
      order: [["quantity", "ASC"]],
    });

    const excelBuffer = await generateLowStockReportExcel(products, threshold);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Low_Stock_Report_${Date.now()}.xlsx`,
    );
    return res.send(excelBuffer);
  } catch (error) {
    console.error("downloadLowStockReportExcel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Low Stock Excel",
    });
  }
};

module.exports = {
  getLowStockReport,
  downloadLowStockReportPDF,
  downloadLowStockReportExcel,
};
