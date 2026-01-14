// config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

console.log("Initializing MySQL connection...");

let sequelize;
let isConnected = false;
let isConnecting = false;

/**
 * Create Sequelize instance (singleton)
 */
function createSequelize() {
  if (sequelize) return sequelize;

  if (process.env.DATABASE_URL) {
    console.log("Using DATABASE_URL (Production)");

    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "mysql",
      logging: false, // Set to console.log temporarily if debugging connection issues

      dialectOptions: {
        connectTimeout: 15000, // Shorter for faster failure detection on shared host
        // ssl: { require: true, rejectUnauthorized: false }, // Keep if BigRock requires SSL; comment out if not needed
        // Add queueing: wait instead of error when pool is full
        waitForConnections: true,
        queueLimit: 0, // 0 = unlimited queue (requests wait), or set low number if you prefer fail-fast
      },

      pool: {
        max: 3, // Slightly up from 2 → allows brief bursts; still very safe for shared hosting
        min: 0,
        acquire: 15000, // Fail fast if can't get conn in 15s
        idle: 10000, // Close idle after 10s (aggressive to free up shared resources)
        evict: 5000, // Check for idle/evict every 5s
        maxUses: 250, // Recycle connection after ~250 uses (~few hours at low traffic; prevents stale/leaks)
        validate: (connection) => {
          // Basic health check before handing out
          return connection
            .query("SELECT 1")
            .then(() => true)
            .catch(() => false);
        },
      },
    });
  } else {
    console.log("Using individual DB credentials (Local)");

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
          connectTimeout: 15000,
        },

        pool: {
          max: 5,
          min: 1,
          acquire: 20000,
          idle: 30000,
          evict: 10000,
          // Optional: add maxUses here too if you want recycle in local
        },
      }
    );
  }

  return sequelize;
}

/**
 * Connect with controlled retry (NO STORM)
 */
async function connectWithRetry(attempt = 1) {
  if (isConnected || isConnecting) return;

  isConnecting = true;

  try {
    await sequelize.authenticate();
    isConnected = true;
    isConnecting = false;
    console.log("✅ MySQL connected successfully");
  } catch (err) {
    isConnecting = false;

    console.error(
      `❌ MySQL connection failed (attempt ${attempt}):`,
      err.message
    );

    if (attempt >= 5) {
      console.error("🛑 Max retries reached. Exiting.");
      process.exit(1);
    }

    const delay = Math.min(5000 * attempt, 30000);
    console.log(`🔁 Retrying in ${delay / 1000}s...`);

    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
}

/**
 * Graceful shutdown (VERY IMPORTANT for Docker/PM2)
 */
async function gracefulShutdown(signal) {
  console.log(`🛑 Received ${signal}. Closing DB connections...`);
  try {
    if (sequelize) await sequelize.close();
    console.log("✅ DB connections closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during DB shutdown:", err.message);
    process.exit(1);
  }
}

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  try {
    if (sequelize) await sequelize.close();
  } finally {
    process.exit(1);
  }
});

process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  try {
    if (sequelize) await sequelize.close();
  } finally {
    process.exit(1);
  }
});

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Initialize
sequelize = createSequelize();
connectWithRetry();

module.exports = sequelize;
