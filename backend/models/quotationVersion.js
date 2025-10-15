const mongoose = require("mongoose");

const quotationVersionSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, index: true }, // Reference to the original quotationId
  version: { type: Number, required: true }, // Incremental version number (e.g., 1, 2, 3...)
  quotationData: { type: Object, required: true }, // Snapshot of Sequelize Quotation model
  quotationItems: [
    {
      productId: String,
      quantity: Number,
      discount: Number,
      tax: Number,
      total: Number,
    },
  ], // Snapshot of MongoDB QuotationItem items
  updatedBy: { type: String, required: true }, // User who made the change
  updatedAt: { type: Date, default: Date.now }, // Timestamp of the version
});

module.exports = mongoose.model("QuotationVersion", quotationVersionSchema);
