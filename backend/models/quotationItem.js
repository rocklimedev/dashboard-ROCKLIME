const mongoose = require("mongoose");

// models/quotationItem.js
const quotationItemsSchema = new mongoose.Schema({
  quotationId: { type: String, required: true },
  items: [
    {
      productId: String,
      name: String,
      imageUrl: String,
      quantity: Number,
      price: Number,
      discount: Number, // e.g., 10 (for 10% or ₹10)
      discountType: {
        // ← ADD THIS
        type: String,
        enum: ["percent", "fixed"],
        default: "percent",
      },
      tax: Number,
      total: Number, // optional: pre-calculated line total (before discount/tax)
    },
  ],
});

module.exports = mongoose.model("QuotationItem", quotationItemsSchema);
