const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const { auth } = require("../middleware/auth");

// Cart Routes
router.post("/add", auth, cartController.addToCart);
router.get("/:userId", cartController.getCart);
router.post("/remove", cartController.removeFromCart);
router.get("/:cartId", cartController.getCartById);
router.post(
  "/convert-to-cart/:quotationId",
  cartController.convertQuotationToCart
);
router.post("/clear", cartController.clearCart);
router.post("/add-to-cart", cartController.addProductToCart);
// Update cart item
router.post("/update", cartController.updateCart);
module.exports = router;
