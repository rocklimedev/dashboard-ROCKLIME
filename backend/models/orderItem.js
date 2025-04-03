const mongoose = require("mongoose");

const orderItemsSchema = new mongoose.Schema({
  orderId: { type: String, required: true }, // Fix: Store UUID as String
  items: [
    {
      productId: { type: String, required: true }, // Assuming UUID as String
      quantity: { type: Number, required: true },
      discount: { type: Number, default: 0 }, // Fix: Store percentage instead of Boolean
      tax: { type: Number, default: 0 }, // Fix: Store percentage instead of Boolean
      total: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("OrderItem", orderItemsSchema);
