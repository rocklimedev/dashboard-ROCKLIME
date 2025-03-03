const mongoose = require("mongoose");

const orderItemsSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
});

module.exports = mongoose.model("OrderItem", orderItemsSchema);
