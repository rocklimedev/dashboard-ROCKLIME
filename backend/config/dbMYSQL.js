// config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

console.log("Connecting to MySQL using individual credentials...");

// ALWAYS use individual credentials — no DATABASE_URL fallback whatsoever
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,

    // Critical timeouts & connection settings
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      // Add SSL only if your host requires it (most shared hosts don't)
      // ssl: { require: true, rejectUnauthorized: false },
    },

    pool: {
      max: 5, // Lower pool on Render (free tier has connection limits)
      min: 0,
      acquire: 60000,
      idle: 10000,
    },

    // Built-in retry for transient errors
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ESOCKETTIMEDOUT/,
        /ECONNREFUSED/,
        /Connection lost/,
        /SequelizeConnectionError/,
      ],
      max: 15,
    },
  }
);

// Keep-alive ping — very important on Render free tier
if (process.env.RENDER || process.env.NODE_ENV === "production") {
  setInterval(() => {
    sequelize
      .query("SELECT 1")
      .catch((err) => console.error("Keep-alive ping failed:", err.message));
  }, 5 * 60 * 1000); // every 5 minutes (safe for Render)
}

// Exponential backoff connection retry
async function connectWithRetry(attempt = 1) {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully!");
  } catch (err) {
    console.log(`MySQL connection attempt ${attempt} failed:`, err.message);

    if (attempt >= 20) {
      console.error("Max connection retries reached. Exiting...");
      process.exit(1);
    }

    const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 30000);
    console.log(
      `Retrying connection in ${Math.round(delay / 1000)} seconds... (attempt ${
        attempt + 1
      })`
    );
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
}

// Start connection
connectWithRetry();

module.exports = sequelize;
