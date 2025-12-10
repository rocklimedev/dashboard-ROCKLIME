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
      index: true, // helpful for sorting
    },
  },
  {
    timestamps: false, // we control updatedAt manually
  }
);

// CRITICAL: This is what prevents duplicates and makes versioning reliable
quotationVersionSchema.index({ quotationId: 1, version: 1 }, { unique: true });

const QuotationVersion = mongoose.model(
  "QuotationVersion",
  quotationVersionSchema
);

module.exports = QuotationVersion;
