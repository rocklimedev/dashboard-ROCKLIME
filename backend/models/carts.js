const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number,
});

const CartSchema = new mongoose.Schema({
  customerId: { type: String, required: false },
  userId: { type: String, required: true },
  items: [CartItemSchema], // Embedded array of cart items
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Cart", CartSchema);
