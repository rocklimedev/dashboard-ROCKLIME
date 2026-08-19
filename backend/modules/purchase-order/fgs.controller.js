// controllers/fieldGuidedSheetController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const crud = require("./services/fgs-crud.service");
const status = require("./services/fgs-status.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // CRUD
  createFieldGuidedSheet: crud.createFieldGuidedSheet,
  updateFieldGuidedSheet: crud.updateFieldGuidedSheet,
  getFieldGuidedSheetById: crud.getFieldGuidedSheetById,
  getAllFieldGuidedSheets: crud.getAllFieldGuidedSheets,
  deleteFieldGuidedSheet: crud.deleteFieldGuidedSheet,

  // Status / Convert
  convertFgsToPo: status.convertFgsToPo,
  updateFieldGuidedSheetStatus: status.updateFieldGuidedSheetStatus,
};
