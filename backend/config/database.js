const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: true,
    dialectOptions: {
      connectTimeout: 120000, // 120s
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    retry: {
      max: 3,
    },
  }
);

// --- keep-alive ping to stop Render’s idle disconnects ---
setInterval(async () => {
  try {
    await sequelize.query("SELECT 1");
  } catch (err) {
    console.error("Keep-alive ping failed:", err.message);
  }
}, 300000); // every 5 min

async function connectWithRetry() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    setTimeout(connectWithRetry, 5000);
  }
}
connectWithRetry();

module.exports = sequelize;
