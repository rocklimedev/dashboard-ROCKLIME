// Suggested safer & cleaner version

const IORedis = require("ioredis");
const { Queue, Worker, QueueEvents } = require("bullmq");

const isProduction = process.env.NODE_ENV === "production";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  family: 4,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 5000);
    console.log(`[Redis] Retry attempt ${times} → waiting ${delay}ms`);
    return delay;
  },
  // Very important in production:
  password: process.env.REDIS_PASSWORD || undefined, // ← add this
  tls:
    isProduction && process.env.REDIS_TLS === "true" // ← if using rediss://
      ? { rejectUnauthorized: false } // adjust as needed
      : undefined,
  // Enable auto-resubscribe in most cases
  enableAutoPipelining: true,
  // Good for Render / Vercel / Docker
  lazyConnect: true,
};

const connection = new IORedis(redisConfig);

// Better logging
connection.on("connect", () => console.log("[Redis] Connected"));
connection.on("ready", () => console.log("[Redis] Ready"));
connection.on("error", (err) => console.error("[Redis] Error:", err));
connection.on("reconnecting", (delay) =>
  console.log(`[Redis] Reconnecting in ${delay}ms`),
);
connection.on("close", () => console.log("[Redis] Connection closed"));

// Optional: test connection right away
(async () => {
  try {
    const pong = await connection.ping();
    console.log("[Redis] PING →", pong);
  } catch (err) {
    console.error("[Redis] Initial connection test failed:", err.message);
  }
})();

const jobsQueue = new Queue("jobs", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600 * 24 * 7 }, // 7 days
    removeOnFail: { count: 1000 },
  },
});

const queueEvents = new QueueEvents("jobs", { connection });

module.exports = {
  connection,
  jobsQueue,
  queueEvents,
};
