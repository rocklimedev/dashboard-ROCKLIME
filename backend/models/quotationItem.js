const mongoose = require("mongoose");

const quotationItemsSchema = new mongoose.Schema({
  quotationId: { type: String, required: true },
  items: [
    {
      productId: String,
      name: String,
      imageUrl: String,
      productCode: {
        // ← NEW
        type: String,
        trim: true,
      },
      companyCode: {
        // ← NEW
        type: String,
        trim: true,
      },
      quantity: Number,
      price: Number,
      discount: Number,
      discountType: {
        type: String,
        enum: ["percent", "fixed"],
        default: "percent",
      },
      tax: Number,
      total: Number,
    },
  ],
});

module.exports = mongoose.model("QuotationItem", quotationItemsSchema);
