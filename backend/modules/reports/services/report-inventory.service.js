const { Product, Brand, Category } = require("../../../models");
const { buildDateFilter } = require("./report-common.service");
const {
  generateInventoryReportPDF,
  generateInventoryReportExcel,
} = require("../../../utils/reportGenerators");
const { Op } = require("sequelize");

const getInventoryReport = async (req, res) => {
  try {
    // Optional: filter by last updated date
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "updatedAt",
    });

    const products = await Product.findAll({
      where: {
        ...dateFilter,
        // You can add status filter if needed
        // status: { [Op.ne]: "inactive" },
      },
      include: [
        { model: Brand, as: "brand", attributes: ["id", "name"] },
        { model: Category, as: "categories", attributes: ["id", "name"] },
      ],
      order: [["name", "ASC"]],
      limit: parseInt(req.query.limit) || 100000,
    });

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("getInventoryReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory report",
    });
  }
};

const downloadInventoryReportPDF = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "updatedAt",
    });

    const products = await Product.findAll({
      where: dateFilter,
      include: [
        { model: Brand, as: "brand", attributes: ["name"] },
        { model: Category, as: "categories", attributes: ["name"] },
      ],
      order: [["name", "ASC"]],
    });

    const pdfBuffer = await generateInventoryReportPDF(products);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Inventory_Report_${Date.now()}.pdf`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadInventoryReportPDF error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Inventory PDF",
    });
  }
};

const downloadInventoryReportExcel = async (req, res) => {
  try {
    const dateFilter = buildDateFilter({
      ...req.query,
      dateField: "updatedAt",
    });

    const products = await Product.findAll({
      where: dateFilter,
      include: [
        { model: Brand, as: "brand", attributes: ["name"] },
        { model: Category, as: "categories", attributes: ["name"] },
      ],
      order: [["name", "ASC"]],
    });

    const excelBuffer = await generateInventoryReportExcel(products);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Inventory_Report_${Date.now()}.xlsx`,
    );
    return res.send(excelBuffer);
  } catch (error) {
    console.error("downloadInventoryReportExcel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Inventory Excel",
    });
  }
};

module.exports = {
  getInventoryReport,
  downloadInventoryReportPDF,
  downloadInventoryReportExcel,
};
