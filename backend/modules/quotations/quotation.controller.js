// controllers/quotationController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const crud = require("./services/quotation-crud.service");
const version = require("./services/quotation-version.service");
const exportSvc = require("./services/quotation-export.service");
const clone = require("./services/quotation-clone.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // CRUD
  createQuotation: crud.createQuotation,
  updateQuotation: crud.updateQuotation,
  getQuotationById: crud.getQuotationById,
  getAllQuotations: crud.getAllQuotations,
  deleteQuotation: crud.deleteQuotation,

  // Version
  restoreQuotationVersion: version.restoreQuotationVersion,
  getQuotationVersions: version.getQuotationVersions,

  // Export
  exportQuotation: exportSvc.exportQuotation,

  // Clone
  cloneQuotation: clone.cloneQuotation,
};
