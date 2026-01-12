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
      logging: false,

      dialectOptions: {
        connectTimeout: 30000,
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },

      pool: {
        max: 2, // VERY IMPORTANT (low traffic VPS)
        min: 0,
        acquire: 30000,
        idle: 5000,
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
          connectTimeout: 30000,
        },

        pool: {
          max: 2,
          min: 0,
          acquire: 30000,
          idle: 5000,
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
 * Graceful shutdown (VERY IMPORTANT for Docker)
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
