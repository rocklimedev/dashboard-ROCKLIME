const mongoose = require("mongoose");

const InventoryHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: String, // Store productId as a String instead of ObjectId
      required: true,
      unique: true, // Ensures each product has only one history entry
    },
    history: [
      {
        quantity: { type: Number, required: true },
        action: {
          type: String,
          enum: ["add-stock", "remove-stock"],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  InventoryHistorySchema
);
module.exports = { InventoryHistory };
