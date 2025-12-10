const mongoose = require("mongoose");

const poItemsSchema = new mongoose.Schema({
  id: { type: String, required: true },
  items: [
    {
      productId: String,
      quantity: Number,
      mrp: Number,
    },
  ],
});

module.exports = mongoose.model("PoItem", poItemsSchema);
