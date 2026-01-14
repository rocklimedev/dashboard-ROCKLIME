const mongoose = require("mongoose");

const quotationVersionSchema = new mongoose.Schema(
  {
    quotationId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    quotationData: {
      type: Object,
      required: true,
    },
    quotationItems: [
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
        discountType: { type: String, default: "fixed" },
        tax: Number,
        total: Number,
      },
    ],
    updatedBy: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Keep the unique index
quotationVersionSchema.index({ quotationId: 1, version: 1 }, { unique: true });

const QuotationVersion = mongoose.model(
  "QuotationVersion",
  quotationVersionSchema
);

module.exports = QuotationVersion;
