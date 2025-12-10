const mongoose = require("mongoose");

const CartItem = new mongoose.Schema({
  productId: { type: String, required: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
});

module.exports = CartItem;
