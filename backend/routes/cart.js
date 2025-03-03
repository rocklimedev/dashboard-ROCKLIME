const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");

// Cart Routes
router.post("/add", cartController.addToCart);
router.get("/:userId", cartController.getCart);
router.post("/remove", cartController.removeFromCart);

module.exports = router;
