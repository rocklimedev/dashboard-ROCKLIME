const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  imageUrl: String,
  productCode: { type: String, trim: true },
  companyCode: { type: String, trim: true },
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

  // Existing optional/group fields
  isOptionFor: { type: String, default: null },
  optionType: {
    type: String,
    enum: ["variant", "upgrade", "addon", null],
    default: null,
  },
  groupId: { type: String, default: null },

  // ────────────────────────────────────────
  //  NEW – Floor & Room linkage
  // ────────────────────────────────────────
  floorId: {
    type: String,
    default: null,
    index: true, // helps if you later query by floor
  },
  floorName: {
    type: String,
    default: null, // denormalized – convenient for display/PDF
  },
  roomId: {
    type: String,
    default: null,
    index: true,
  },
  roomName: {
    type: String,
    default: null, // denormalized
  },
  areaId: { type: String, default: null, index: true }, // references areas[].id in the room
  areaName: { type: String, default: null }, // denormalized copy
  areaValue: { type: String, default: null },
});

const quotationItemsSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, index: true },
  items: [quotationItemSchema],
});

module.exports = mongoose.model("QuotationItem", quotationItemsSchema);
