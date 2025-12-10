require("express-async-errors"); // Required at the top to catch async errors automatically
const { ValidationError } = require("sequelize");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      message: "Validation Error",
      errors: err.errors.map((error) => error.message),
    });
  }

  // Handle specific errors with status
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  // Default to 500 for unexpected errors
  res.status(500).json({ message: err.message || "Internal Server Error" });
};

module.exports = errorHandler;
