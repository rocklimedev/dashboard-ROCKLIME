const mongoose = require("mongoose");

const taskBoardSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => require("uuid").v4(), // Generate UUID for boardId
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    resourceType: {
      type: String,
      enum: [
        "address",
        "attendance",
        "auth",
        "brand_parentcategories",
        "brands",
        "cart",
        "categories",
        "companies",
        "contact",
        "customers",
        "Invoices",
        "keywords",
        "logging",
        "notifications",
        "orders",
        "parentcategories",
        "permissions",
        "product_meta",
        "products",
        "purchase_orders",
        "quotations",
        "rolepermissions",
        "roles",
        "signatures",
        "task_boards",
        "tasks",
        "teams",
        "users",
        "vendors",
      ],
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    owner: {
      type: String, // userId from MySQL
      required: true,
      index: true,
    },
    createdBy: {
      type: String, // userId from MySQL
      required: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    watchers: [
      {
        type: String, // userId from MySQL
      },
    ],
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: String, // userId from MySQL
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for resourceType and resourceId
taskBoardSchema.index({ resourceType: 1, resourceId: 1 });

// Static method to generate unique boardId
taskBoardSchema.statics.generateBoardId = async function () {
  const moment = require("moment");
  const today = moment().format("DDMMYYYY");

  const count = await this.countDocuments({
    boardId: new RegExp(`^BRD${today}`),
  });

  const serialNumber = String(count + 1).padStart(5, "0");
  return `BRD${today}${serialNumber}`;
};

// Pre-save hook to generate boardId
taskBoardSchema.pre("save", async function (next) {
  if (this.isNew && !this.boardId) {
    this.boardId = await mongoose.model("TaskBoard").generateBoardId();
  }
  next();
});

const TaskBoard = mongoose.model("TaskBoard", taskBoardSchema);

module.exports = TaskBoard;
