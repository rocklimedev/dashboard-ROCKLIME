const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String, // UUID as string to match Sequelize
      required: [true, "Resource ID is required"],
      index: true, // Index for faster queries
    },
    resourceType: {
      type: String,
      required: [true, "Resource type is required"],
      enum: ["Order", "Product", "Customer"], // Add more types as needed
      index: true, // Index for faster queries
    },
    userId: {
      type: String, // UUID as string to match Sequelize User.userId
      required: [true, "User ID is required"],
      ref: "User", // Reference to User model (if in MongoDB)
      index: true, // Index for faster queries
    },
    comment: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "comments",
    timestamps: false, // Only use createdAt, no updatedAt
  }
);

// Compound index to optimize queries for comment limit check
CommentSchema.index({ resourceId: 1, resourceType: 1, userId: 1 });

// Method to check comment limit for a user on a resource
CommentSchema.statics.hasReachedCommentLimit = async function (
  resourceId,
  resourceType,
  userId
) {
  const count = await this.countDocuments({ resourceId, resourceType, userId });
  return count >= 3;
};

module.exports = mongoose.model("Comment", CommentSchema);
