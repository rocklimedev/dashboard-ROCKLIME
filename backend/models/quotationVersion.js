const mongoose = require("mongoose");

const quotationItemVersionSchema = new mongoose.Schema({
  productId: String,
  name: String,
  imageUrl: String,
  productCode: { type: String, trim: true },
  companyCode: { type: String, trim: true },
  quantity: Number,
  price: Number,
  discount: Number,
  discountType: { type: String, default: "fixed" },
  tax: Number,
  total: Number,

  isOptionFor: { type: String, default: null },
  optionType: {
    type: String,
    enum: ["variant", "upgrade", "addon", null],
    default: null,
  },
  groupId: { type: String, default: null },

  // ────────────────────────────────────────
  //  NEW – same as QuotationItem
  // ────────────────────────────────────────
  floorId: { type: String, default: null },
  floorName: { type: String, default: null },
  roomId: { type: String, default: null },
  roomName: { type: String, default: null },
});

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
    quotationItems: [quotationItemVersionSchema],
    floors: {
      // ← NEW – snapshot the floors structure too
      type: Array,
      default: [],
    },
    totalFloors: {
      type: Number,
      default: 0,
    },
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
  },
);

quotationVersionSchema.index({ quotationId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("QuotationVersion", quotationVersionSchema);
