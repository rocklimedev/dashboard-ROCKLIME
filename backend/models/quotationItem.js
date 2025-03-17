const mongoose = require("mongoose");

const quotationItemsSchema = new mongoose.Schema({
  quotationId: { type: String, required: true },
  items: [
    {
      productId: String,
      quantity: Number,
      discount: Number, // Change from Boolean to Number
      tax: Number, // Change from Boolean to Number
      total: Number,
    },
  ],
});

module.exports = mongoose.model("QuotationItem", quotationItemsSchema);
