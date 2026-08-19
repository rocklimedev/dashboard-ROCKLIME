const crud = require("./services/purchase-order-crud.service");
const status = require("./services/purchase-order-status.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // CRUD
  createPurchaseOrder: crud.createPurchaseOrder,
  updatePurchaseOrder: crud.updatePurchaseOrder,
  getPurchaseOrderById: crud.getPurchaseOrderById,
  getAllPurchaseOrders: crud.getAllPurchaseOrders,
  deletePurchaseOrder: crud.deletePurchaseOrder,
  getPurchaseOrdersByVendor: crud.getPurchaseOrdersByVendor,

  // Status / Confirm / Utility
  confirmPurchaseOrder: status.confirmPurchaseOrder,
  updatePurchaseOrderStatus: status.updatePurchaseOrderStatus,
  createPurchaseOrderFromData: status.createPurchaseOrderFromData,
};
