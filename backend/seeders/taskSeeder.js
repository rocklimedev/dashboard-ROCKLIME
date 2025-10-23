const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const Task = require("../models/tasks"); // Path to Task model

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("🟢 MongoDB connected successfully");
  } catch (error) {
    console.error("🔴 MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedTasks = async () => {
  try {
    // Clear existing tasks
    await Task.deleteMany({});
    console.log("Cleared existing tasks");

    // Sample task data linked to orders
    const tasks = [
      {
        taskId: uuidv4(),
        title: "Review Order Details",
        description:
          "Verify order details and confirm products for order #161025104.",
        status: "PENDING",
        priority: "high",
        assignedTo: "5ee872f3-a316-4de6-a55e-959a762f2327", // Dhruv Verma
        assignedBy: "5ee872f3-a316-4de6-a55e-959a762f2327",
        assignedTeamId: "92cb5110-1993-4c6d-a7bf-3f9f1f96ead7", // Operations #2
        dueDate: new Date("2025-10-18"),
        linkedResource: {
          resourceType: "Order",
          resourceId: "ce5ac447-fb65-4530-900d-eea167f32ebd", // Order #161025104
        },
        tags: ["Internal", "Order Review"],
        watchers: ["e30d0df5-b413-462f-9bdc-ae86813add52"], // Yuvraj Singh
        checklist: [
          { item: "Check product quantities", isCompleted: false },
          {
            item: "Verify customer details",
            isCompleted: true,
            completedAt: new Date(),
            completedBy: "5ee872f3-a316-4de6-a55e-959a762f2327",
          },
        ],
        estimatedHours: 2,
        actualHours: 1,
      },
      {
        taskId: uuidv4(),
        title: "Prepare Invoice for Order",
        description: "Generate invoice for order #161025103.",
        status: "IN_PROGRESS",
        priority: "medium",
        assignedTo: "e30d0df5-b413-462f-9bdc-ae86813add52", // Yuvraj Singh
        assignedBy: "5ee872f3-a316-4de6-a55e-959a762f2327",
        assignedTeamId: "92cb5110-1993-4c6d-a7bf-3f9f1f96ead7",
        dueDate: new Date("2025-10-17"),
        linkedResource: {
          resourceType: "Order",
          resourceId: "7cadb68d-1899-4f2d-bf2d-2cb63d88b921", // Order #161025103
        },
        tags: ["Invoice", "Finance"],
        watchers: ["5ee872f3-a316-4de6-a55e-959a762f2327"],
        checklist: [
          { item: "Draft invoice", isCompleted: false },
          { item: "Send to customer", isCompleted: false },
        ],
        estimatedHours: 3,
      },
      {
        taskId: uuidv4(),
        title: "Follow Up on Order ZXZXCC",
        description: "Contact customer for order #161025102 status update.",
        status: "PENDING",
        priority: "low",
        assignedTo: "5ee872f3-a316-4de6-a55e-959a762f2327",
        assignedBy: "5ee872f3-a316-4de6-a55e-959a762f2327",
        assignedTeamId: "92cb5110-1993-4c6d-a7bf-3f9f1f96ead7",
        dueDate: new Date("2025-10-20"),
        linkedResource: {
          resourceType: "Order",
          resourceId: "a230c567-0a01-494b-b9f1-c6011476f0e5", // Order #161025102
        },
        tags: ["Customer", "Follow-up"],
        watchers: ["e30d0df5-b413-462f-9bdc-ae86813add52"],
        estimatedHours: 1,
      },
      {
        taskId: uuidv4(),
        title: "Ship Order #161025101",
        description: "Coordinate shipping for order #161025101.",
        status: "COMPLETED",
        priority: "medium",
        assignedTo: "e30d0df5-b413-462f-9bdc-ae86813add52",
        assignedBy: "5ee872f3-a316-4de6-a55e-959a762f2327",
        assignedTeamId: "92cb5110-1993-4c6d-a7bf-3f9f1f96ead7",
        dueDate: new Date("2025-10-16"),
        completedDate: new Date("2025-10-16"),
        linkedResource: {
          resourceType: "Order",
          resourceId: "663f40d7-4d5e-4d79-af08-4edcdcc63f00", // Order #161025101
        },
        tags: ["Shipping", "Logistics"],
        watchers: ["5ee872f3-a316-4de6-a55e-959a762f2327"],
        checklist: [
          {
            item: "Pack products",
            isCompleted: true,
            completedAt: new Date("2025-10-16"),
            completedBy: "e30d0df5-b413-462f-9bdc-ae86813add52",
          },
          {
            item: "Arrange courier",
            isCompleted: true,
            completedAt: new Date("2025-10-16"),
            completedBy: "e30d0df5-b413-462f-9bdc-ae86813add52",
          },
        ],
        estimatedHours: 4,
        actualHours: 3,
      },
      {
        taskId: uuidv4(),
        title: "Update Customer Records",
        description: "Update customer details for Rahul Verma.",
        status: "ON_HOLD",
        priority: "low",
        assignedTo: "5ee872f3-a316-4de6-a55e-959a762f2327",
        assignedBy: "5ee872f3-a316-4de6-a55e-959a762f2327",
        dueDate: new Date("2025-10-25"),
        linkedResource: {
          resourceType: "Customer",
          resourceId: "28a7fffe-a984-11f0-b7f0-52540021303b", // Rahul Verma
        },
        tags: ["Customer", "Admin"],
        watchers: [],
        estimatedHours: 2,
      },
    ];

    // Insert tasks
    await Task.insertMany(tasks);
    console.log(`Seeded ${tasks.length} tasks`);

    // Close connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.error("Error seeding tasks:", err);
    process.exit(1);
  }
};

// Run seeder
connectDB().then(() => seedTasks());
