// config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

console.log("Connecting to MySQL...");

// Auto-detect: use DATABASE_URL on Render, fall back to individual vars locally
let sequelize;

if (process.env.DATABASE_URL) {
  // Render.com (and any platform using DATABASE_URL)
  console.log("Using DATABASE_URL (Render/Production mode)");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ESOCKETTIMEDOUT/,
        /Connection lost/,
      ],
      max: 10,
    },
  });
} else {
  // Local development
  console.log("Using individual DB credentials (Local mode)");
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      dialectOptions: {
        connectTimeout: 60000,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
    }
  );
}

// Keep-alive ping (only in production/Render)
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  setInterval(() => {
    sequelize.query("SELECT 1").catch((err) => {
      console.error("Keep-alive ping failed:", err.message);
    });
  }, 8 * 60 * 1000); // 8 minutes
}

// Connect with retry (works everywhere)
async function connectWithRetry(attempt = 1) {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully!");
  } catch (err) {
    console.log(`MySQL connection attempt ${attempt} failed:`, err.message);
    if (attempt >= 15) {
      console.error("Max retries reached. Giving up.");
      process.exit(1);
    }
    const delay = Math.min(1000 * 2 ** attempt, 30000);
    console.log(`Retrying in ${delay / 1000}s...`);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
}

connectWithRetry();

module.exports = sequelize;
