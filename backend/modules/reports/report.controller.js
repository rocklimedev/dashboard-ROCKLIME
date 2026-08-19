// controllers/reportController.js
const orderReport = require("./services/report-order.service");
const quotationReport = require("./services/report-quotation.service");
const poReport = require("./services/report-po.service");
const inventoryReport = require("./services/report-inventory.service");
const lowStockReport = require("./services/report-lowstock.service");
const common = require("./services/report-common.service");

module.exports = {
  // Stats
  getReportStats: common.getReportStats,

  // Order
  getOrderReport: orderReport.getOrderReport,
  downloadOrderReportPDF: orderReport.downloadOrderReportPDF,
  downloadOrderReportExcel: orderReport.downloadOrderReportExcel,

  // Quotation
  getQuotationReport: quotationReport.getQuotationReport,
  downloadQuotationReportPDF: quotationReport.downloadQuotationReportPDF,
  downloadQuotationReportExcel: quotationReport.downloadQuotationReportExcel,

  // Purchase Order
  getPOReport: poReport.getPOReport,
  downloadPOReportPDF: poReport.downloadPOReportPDF,
  downloadPOReportExcel: poReport.downloadPOReportExcel,

  // Inventory
  getInventoryReport: inventoryReport.getInventoryReport,
  downloadInventoryReportPDF: inventoryReport.downloadInventoryReportPDF,
  downloadInventoryReportExcel: inventoryReport.downloadInventoryReportExcel,

  // Low Stock
  getLowStockReport: lowStockReport.getLowStockReport,
  downloadLowStockReportPDF: lowStockReport.downloadLowStockReportPDF,
  downloadLowStockReportExcel: lowStockReport.downloadLowStockReportExcel,
};
