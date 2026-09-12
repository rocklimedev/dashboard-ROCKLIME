const quotationService = require("./services/quotation.service");
const { exportQuotation } = require("./services/export.service");

// ─────────────────────────────────────────────
// CREATE QUOTATION
// ─────────────────────────────────────────────
exports.createQuotation = async (req, res) => {
  const result = await quotationService.createQuotation(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// UPDATE QUOTATION
// ─────────────────────────────────────────────
exports.updateQuotation = async (req, res) => {
  const result = await quotationService.updateQuotation(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// EXPORT TO EXCEL
// ─────────────────────────────────────────────
exports.exportQuotation = exportQuotation;

// ─────────────────────────────────────────────
// CLONE QUOTATION
// ─────────────────────────────────────────────
exports.cloneQuotation = async (req, res) => {
  const result = await quotationService.cloneQuotation(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// RESTORE VERSION
// ─────────────────────────────────────────────
exports.restoreQuotationVersion = async (req, res) => {
  const result = await quotationService.restoreQuotationVersion(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────
exports.getQuotationById = async (req, res) => {
  const result = await quotationService.getQuotationById(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
exports.getAllQuotations = async (req, res) => {
  const result = await quotationService.getAllQuotations(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
exports.deleteQuotation = async (req, res) => {
  const result = await quotationService.deleteQuotation(req);
  return res.status(result.status).json(result.body);
};

// ─────────────────────────────────────────────
// GET VERSIONS
// ─────────────────────────────────────────────
exports.getQuotationVersions = async (req, res) => {
  const result = await quotationService.getQuotationVersions(req);
  return res.status(result.status).json(result.body);
};
