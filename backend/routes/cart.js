const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const { auth } = require("../middleware/auth");

// Cart Routes
router.post("/add", auth, cartController.addToCart);
router.get("/:userId", cartController.getCart);
router.post("/remove", cartController.removeFromCart);

module.exports = router;
