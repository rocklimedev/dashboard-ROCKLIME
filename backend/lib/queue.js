// lib/queue.js
const IORedis = require("ioredis");
const { Queue, Worker, QueueEvents } = require("bullmq");

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

const connection = new IORedis({
  host: redisHost,
  port: redisPort,
  family: 4,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    console.log(`Redis retry ${times}...`);
    return Math.min(times * 100, 5000);
  },
});

connection.on("connect", () =>
  console.log(`[Redis] Socket connected to ${redisHost}:${redisPort}`),
);
connection.on("ready", () => console.log("[Redis] Ready (commands accepted)"));
connection.on("error", (err) => console.error("[Redis] Error:", err.message));
connection.on("reconnecting", (delay) =>
  console.log(`[Redis] Reconnecting in ${delay}ms`),
);

// Use a single queue name for all job types
const jobsQueue = new Queue("jobs", { connection });

// Optional: events for monitoring
const queueEvents = new QueueEvents("jobs", { connection });

module.exports = {
  connection,
  jobsQueue,
  queueEvents,
};
