// lib/queue.js
const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

// lib/queue.js
const connection = new IORedis({
  host: "localhost", // or '127.0.0.1'
  port: 6379,
  // password: 'yourpassword', // only if you set one
  maxRetriesPerRequest: null,
});

const bulkImportQueue = new Queue("bulk-product-import", { connection });

// Optional: events for monitoring (can be used for webhooks later)
const queueEvents = new QueueEvents("bulk-product-import", { connection });

module.exports = {
  bulkImportQueue,
  connection,
};
