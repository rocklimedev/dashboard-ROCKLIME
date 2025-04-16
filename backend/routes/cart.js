const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const { auth } = require("../middleware/auth");

// Cart Routes
router.post(
  "/add",
  auth,
  checkPermission("write", "add_to_cart", "cart", "/cart/add"),
  cartController.addToCart
);
router.get(
  "/:userId",
  checkPermission("view", "get_cart_of_user", "cart", "/cart/:userId"),
  cartController.getCart
);
router.post(
  "/remove",
  checkPermission("write", "remove_from_cart", "cart", "/cart/remove"),
  cartController.removeFromCart
);
router.get(
  "/:cartId",
  checkPermission("view", "get_cart", "cart", "/cart/:cartId"),
  cartController.getCartById
);
router.post(
  "/convert-to-cart/:quotationId",
  checkPermission(
    "write",
    "convert_quotation_to_cart",
    "cart",
    "/cart/convert-to-cart/:quotationId"
  ),
  cartController.convertQuotationToCart
);
router.post(
  "/clear",
  checkPermission("post", "clear_cart", "cart", "/cart/clear"),
  cartController.clearCart
);
router.post(
  "/add-to-cart",
  checkPermission("write", "add_product_to_cart", "cart", "/cart/add-to-cart"),
  cartController.addProductToCart
);
// Update cart item
router.post(
  "/update",
  checkPermission("write", "update_cart", "cart", "/cart/update"),
  cartController.updateCart
);
router.get(
  "/all",
  checkPermission("view", "get_all_carts", "cart", "/cart/all"),
  cartController.getAllCarts
);
router.post(
  "/reduce",
  checkPermission("post", "reuce_product_quantity", "cart", "/cart/reduce"),
  cartController.reduceQuantity
);
module.exports = router;
