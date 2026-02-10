const IORedis = require("ioredis");
const { Queue, Worker, QueueEvents } = require("bullmq");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  family: 4,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    console.log(`[Redis] Retry attempt ${times}`);
    return Math.min(times * 100, 5000);
  },
});

connection.on("connect", () => console.log("[Redis] Socket connected"));
connection.on("ready", () => console.log("[Redis] Ready (commands accepted)"));
connection.on("error", (err) => console.error("[Redis] Error:", err.message));
connection.on("reconnecting", (delay) =>
  console.log(`[Redis] Reconnecting in ${delay}ms`),
);

connection
  .ping()
  .then((res) => console.log("[Redis] PING:", res))
  .catch((err) => console.error("[Redis] PING failed:", err.message));

const jobsQueue = new Queue("jobs", { connection });
const queueEvents = new QueueEvents("jobs", { connection });

module.exports = {
  connection,
  jobsQueue,
  queueEvents,
};
