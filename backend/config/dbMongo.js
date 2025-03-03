const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI; // Change DB name

const connectMongoDB = async () => {
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

module.exports = connectMongoDB;
