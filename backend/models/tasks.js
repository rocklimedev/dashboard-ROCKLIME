const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => require("uuid").v4(), // Generate UUID by default
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "IN_PROGRESS",
        "REVIEW",
        "COMPLETED",
        "CANCELLED",
        "ON_HOLD",
      ],
      default: "PENDING",
      index: true,
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
      index: true,
    },
    // Assignment
    assignedTo: {
      type: String, // userId from MySQL
      required: true,
      index: true,
    },
    assignedBy: {
      type: String, // userId from MySQL
      required: true,
      index: true,
    },
    assignedTeamId: {
      type: String, // teamId from MySQL
      index: true,
    },
    // Dates
    dueDate: {
      type: Date,
      index: true,
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    // Linked resources (polymorphic)
    linkedResource: {
      resourceType: {
        type: String,
        enum: ["Order", "Customer", "Product", "Quotation", "Invoice", null],
      },
      resourceId: {
        type: String,
      },
    },
    // Task metadata
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        filename: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: String, // userId
      },
    ],
    // Checklist
    checklist: [
      {
        item: {
          type: String,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        completedBy: String, // userId
      },
    ],
    // Time tracking
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Watchers (users who want to be notified)
    watchers: [
      {
        type: String, // userId
      },
    ],
    // Dependencies
    dependsOn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    // Recurrence (for recurring tasks)
    recurrence: {
      enabled: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: {
        type: Number,
        min: 1,
      },
      endDate: Date,
      lastGenerated: Date,
    },
    // Add to taskSchema
    taskBoard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskBoard",
      index: true,
    },
    // Archival
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: Date,
    archivedBy: String, // userId
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({
  "linkedResource.resourceType": 1,
  "linkedResource.resourceId": 1,
});
taskSchema.index({ tags: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ isArchived: 1, status: 1 });
taskSchema.index({ taskBoard: 1 });
// Virtual for progress percentage
taskSchema.virtual("progress").get(function () {
  if (!this.checklist || this.checklist.length === 0) {
    return 0;
  }
  const completed = this.checklist.filter((item) => item.isCompleted).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Virtual for overdue status
taskSchema.virtual("isOverdue").get(function () {
  if (
    !this.dueDate ||
    this.status === "COMPLETED" ||
    this.status === "CANCELLED"
  ) {
    return false;
  }
  return new Date() > this.dueDate;
});

// Method to check if task is blocked
taskSchema.methods.isBlocked = async function () {
  if (!this.blockedBy || this.blockedBy.length === 0) {
    return false;
  }

  const Task = mongoose.model("Task");
  const blockingTasks = await Task.find({
    _id: { $in: this.blockedBy },
    status: { $nin: ["COMPLETED", "CANCELLED"] },
  });

  return blockingTasks.length > 0;
};

// Static method to generate unique taskId
taskSchema.statics.generateTaskId = async function () {
  const moment = require("moment");
  const today = moment().format("DDMMYYYY");

  const count = await this.countDocuments({
    taskId: new RegExp(`^TSK${today}`),
  });

  const serialNumber = String(count + 1).padStart(5, "0");
  return `TSK${today}${serialNumber}`;
};

// Pre-save hook to generate taskId
taskSchema.pre("save", async function (next) {
  if (this.isNew && !this.taskId) {
    this.taskId = await mongoose.model("Task").generateTaskId();
  }
  next();
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
