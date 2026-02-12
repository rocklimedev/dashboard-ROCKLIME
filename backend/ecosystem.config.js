module.exports = {
  apps: [
    {
      name: "api",
      script: "./index.js", // your Express server
      instances: 1, // or 'max' / -1 for cluster mode
      exec_mode: "fork", // or 'cluster' if stateless
      env: { NODE_ENV: "production" },
    },
    {
      name: "bulk-import-worker",
      script: "./workers/bulkImportWorker.js",
      instances: 1, // start with 1; increase to 2–4 later
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      autorestart: true,
      max_memory_restart: "800M",
    },
  ],
};
