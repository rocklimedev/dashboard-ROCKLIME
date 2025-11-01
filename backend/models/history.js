// models/InventoryHistory.js
const mongoose = require("mongoose");

const HistoryEntrySchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  action: {
    type: String,
    enum: ["add-stock", "remove-stock"],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  orderNo: { type: Number, required: false },
  userId: { type: String, required: false },

  // NEW FIELD
  message: { type: String, required: false },
});

const InventoryHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
    },
    history: [HistoryEntrySchema],
  },
  { timestamps: true }
);

InventoryHistorySchema.index({ productId: 1 });
InventoryHistorySchema.index({ "history.timestamp": -1 });

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  InventoryHistorySchema
);

module.exports = InventoryHistory; // exported directly
