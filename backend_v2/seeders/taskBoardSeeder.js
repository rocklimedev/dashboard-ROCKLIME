const mongoose = require("mongoose");
const dotenv = require("dotenv");
const TaskBoard = require("../models/taskBoard"); // Adjust path to your TaskBoard model
const fs = require("fs");
const path = require("path");
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
// Seeder function
const seedTaskBoards = async () => {
  try {
    // Read taskBoards.json
    const taskBoardsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "taskboard.json"), "utf-8")
    );

    // Clear existing TaskBoard data
    await TaskBoard.deleteMany({});
    console.log("Existing TaskBoards cleared");

    // Insert new TaskBoard data
    await TaskBoard.insertMany(taskBoardsData);
    console.log("TaskBoards seeded successfully");

    // Close the database connection
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error("Error seeding TaskBoards:", err);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Execute seeder
const runSeeder = async () => {
  await connectDB();
  await seedTaskBoards();
};

// Run the seeder
runSeeder();
