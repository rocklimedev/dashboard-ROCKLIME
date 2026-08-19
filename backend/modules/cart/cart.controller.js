// controllers/cartController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const core = require("./services/cart-core.service");
const advanced = require("./services/cart-advanced.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // Core cart operations
  addProductToCart: core.addProductToCart,
  addToCart: core.addToCart,
  getCart: core.getCart,
  removeFromCart: core.removeFromCart,
  updateCart: core.updateCart,
  clearCart: core.clearCart,
  reduceQuantity: core.reduceQuantity,

  // Advanced
  convertQuotationToCart: advanced.convertQuotationToCart,
  getCartById: advanced.getCartById,
  getAllCarts: advanced.getAllCarts,
};
