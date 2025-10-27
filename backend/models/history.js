const mongoose = require("mongoose");

const InventoryHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: String, // Store productId as a String (UUID from Product model)
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
        orderNo: { type: Number, required: false }, // Add orderNo to track the order
        userId: { type: String, required: false }, // Add userId to track the user
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
