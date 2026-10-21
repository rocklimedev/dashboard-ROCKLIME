function startKeepAlive() {
  if (process.env.NODE_ENV === "production" || process.env.RENDER) {
    const axios = require("axios");

    // Ping ourselves every 10 minutes to keep Render + MySQL awake
    setInterval(
      async () => {
        try {
          const url =
            process.env.RENDER_EXTERNAL_URL ||
            `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;
          await axios.get(`${url}/api/health`, { timeout: 10000 });
          console.log(
            `[KEEP-ALIVE] Pinged ${url}/api/health → MySQL stays awake`,
          );
        } catch (err) {
          console.error("[KEEP-ALIVE] Ping failed:", err.code || err.message);
        }
      },
      10 * 60 * 1000,
    ); // Every 10 minutes
  }
}
module.exports = { startKeepAlive };
