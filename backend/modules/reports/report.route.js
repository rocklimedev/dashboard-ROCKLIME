const express = require("express");
const router = express.Router();

const reportController = require("./report.controller");

// Stats
router.get("/stats", reportController.getReportStats);

// Order
router.get("/orders", reportController.getOrderReport);
router.get("/orders/pdf", reportController.downloadOrderReportPDF);
router.get("/orders/excel", reportController.downloadOrderReportExcel);

// Quotation
router.get("/quotations", reportController.getQuotationReport);
router.get("/quotations/pdf", reportController.downloadQuotationReportPDF);
router.get("/quotations/excel", reportController.downloadQuotationReportExcel);

// Purchase Order
router.get("/purchase-orders", reportController.getPOReport);
router.get("/purchase-orders/pdf", reportController.downloadPOReportPDF);
router.get("/purchase-orders/excel", reportController.downloadPOReportExcel);

// Inventory
router.get("/inventory", reportController.getInventoryReport);
router.get("/inventory/pdf", reportController.downloadInventoryReportPDF);
router.get("/inventory/excel", reportController.downloadInventoryReportExcel);

// Low Stock
router.get("/low-stock", reportController.getLowStockReport);
router.get("/low-stock/pdf", reportController.downloadLowStockReportPDF);
router.get("/low-stock/excel", reportController.downloadLowStockReportExcel);

module.exports = router;
