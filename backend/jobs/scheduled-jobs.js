const cron = require("node-cron");
const CachedPermission = require("../modules/rbac/models/cached-permission.model");

function startScheduledJobs() {
  // ------------------- Daily Cron: Clear Cached Permissions -------------------
  cron.schedule("0 2 * * *", async () => {
    try {
      const result = await CachedPermission.deleteMany({});
      console.log(
        `[CRON] Cleared ${result.deletedCount} cached permissions at 2 AM`,
      );
    } catch (err) {
      console.error("[CRON] Failed to clear cache:", err);
    }
  });

  // ------------------- Daily Cron: release stock of long on-hold orders -------------------
  cron.schedule("15 3 * * *", async () => {
    try {
      const n = await require("../modules/stock/stock.service").releaseStaleOnHold();
      if (n) console.log(`[CRON] Released stock of ${n} long on-hold order(s)`);
    } catch (err) {
      console.error("[CRON] On-hold release failed:", err.message);
    }
  });

  // ------------------- Daily Cron: owner's summary email at 8 pm IST -------------------
  cron.schedule(
    "0 20 * * *",
    async () => {
      try {
        const r = await require("../modules/dashboard/daily-summary").sendSummary();
        console.log(`[CRON] Daily summary: ${r.sent ? `sent to ${r.to.join(", ")}` : r.reason}`);
      } catch (err) {
        console.error("[CRON] Daily summary failed:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  // ------------------- Daily Cron: expire quotations past their valid-till date -------------------
  cron.schedule("5 0 * * *", async () => {
    try {
      const n = await require("../modules/quotations/pipeline").expireOverdue({ force: true });
      if (n) console.log(`[CRON] ${n} quotation(s) expired`);
    } catch (err) {
      console.error("[CRON] Quotation expiry failed:", err.message);
    }
  });

}
module.exports = { startScheduledJobs };
