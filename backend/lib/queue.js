// lib/queue.js
const IORedis = require("ioredis");
const { Queue, Worker, QueueEvents } = require("bullmq");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  family: 4,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    console.log(`Redis retry ${times}...`);
    return Math.min(times * 100, 5000);
  },
});

connection.on("connect", () => console.log("[Redis] Socket connected"));
connection.on("ready", () => console.log("[Redis] Ready (commands accepted)"));
connection.on("error", (err) => console.error("[Redis] Error:", err.message));
connection.on("reconnecting", (delay) =>
  console.log(`[Redis] Reconnecting in ${delay}ms`),
);

// Use a single queue name for all job types
const jobsQueue = new Queue("jobs", { connection });

// Optional: events for monitoring (you can listen in another file if needed)
const queueEvents = new QueueEvents("jobs", { connection });

module.exports = {
  connection,
  jobsQueue, // ← renamed & exported
  queueEvents, // optional but useful for real-time progress
};
