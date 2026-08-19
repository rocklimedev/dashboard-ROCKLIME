// controllers/orderController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const comments = require("./services/order-comment.service");
const create = require("./services/order-create.service");
const get = require("./services/order-get.service");
const document = require("./services/order-document.service");
const update = require("./services/order-update.service");

module.exports = {
  // Comments
  getComments: comments.getComments,
  addComment: comments.addComment,
  deleteCommentsByResource: comments.deleteCommentsByResource,
  deleteComment: comments.deleteComment,

  // Create
  createOrder: create.createOrder,
  draftOrder: create.draftOrder,

  // Get / list
  getAllOrders: get.getAllOrders,
  getOrderDetails: get.getOrderDetails,
  recentOrders: get.recentOrders,
  orderById: get.orderById,
  getFilteredOrders: get.getFilteredOrders,
  countOrders: get.countOrders,

  // Documents
  downloadOrder: document.downloadOrder,
  downloadInvoice: document.downloadInvoice,
  uploadInvoiceAndLinkOrder: document.uploadInvoiceAndLinkOrder,
  issueGatePass: document.issueGatePass,
  getDownloadDocument: document.getDownloadDocument,

  // Update / delete / status
  updateOrderById: update.updateOrderById,
  updateOrderStatus: update.updateOrderStatus,
  updateOrderTeam: update.updateOrderTeam,
  deleteOrder: update.deleteOrder,
};
