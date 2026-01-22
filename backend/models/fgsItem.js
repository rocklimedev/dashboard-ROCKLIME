
// ─────────────────────────────────────────────────────────────
// NEW MongoDB Model: models/fgsItem.js
// Similar to poItem
// ─────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const fgsItemSchema = new mongoose.Schema(
  {
    fgsId: {
      type: String,
      required: true,
      index: true,
    },
    fgsNumber: {
      type: String,
      required: true,
      index: true,
    },
    vendorId: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true, trim: true },
        productCode: { type: String, trim: true },
        companyCode: {
          type: String,
          trim: true,
        },
        imageUrl: {
          type: String,
          trim: true,
          default: null,
        },
        quantity: { type: Number, min: 1, required: true },
        unitPrice: { type: Number, min: 0, required: true },
        mrp: { type: Number, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        discountType: {
          type: String,
          enum: ["percent", "fixed"],
          default: "percent",
        },
        tax: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    calculatedTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "fgs_items",
  },
);

fgsItemSchema.index({ fgsId: 1 });
fgsItemSchema.index({ fgsNumber: 1 });

module.exports = mongoose.model("FgsItem", fgsItemSchema);
