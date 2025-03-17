const mongoose = require("mongoose");

const orderItemsSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  items: [
    {
      productId: String,
      quantity: Number,
      discount: Boolean,
      tax: Boolean,
      total: Number,
    },
  ],
});

module.exports = mongoose.model("OrderItem", orderItemsSchema);
