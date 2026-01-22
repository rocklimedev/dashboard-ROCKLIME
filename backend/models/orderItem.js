// models/orderItem.js
const mongoose = require("mongoose");

const orderItemsSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },

    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true }, // ← NEW: cached name
        imageUrl: { type: String }, // ← NEW: first image
          productCode: { type: String, trim: true },
        companyCode: {
          // ← NEW
          type: String,
          trim: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 }, // 10 = 10% or ₹10
        discountType: {
          type: String,
          enum: ["percent", "fixed"],
          default: "percent",
          required: true,
        },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true }, // final line total after discount
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderItem", orderItemsSchema);
