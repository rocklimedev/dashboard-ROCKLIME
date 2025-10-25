// models/Feedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: [true, "Route tag is required"],
    trim: true,
    enum: {
      values: [
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
      message: "Invalid route tag",
    },
  },
  message: {
    type: String,
    required: [true, "Feedback message is required"],
    trim: true,
    minlength: [10, "Message must be at least 10 characters long"],
    maxlength: [1000, "Message cannot exceed 1000 characters"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  imageUrls: {
    type: [String],
    validate: {
      validator: function (urls) {
        return urls.every(
          (url) =>
            typeof url === "string" &&
            url.match(/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp))$/i)
        );
      },
      message: "Invalid image URL format",
    },
    default: [],
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved", "dismissed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Feedback", feedbackSchema);
