const db = require('../config/database');

function registerHealthRoutes(app) {
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
  });
  // ------------------- KEEP-ALIVE & DB HEALTH ENDPOINT (CRITICAL FOR RENDER) -------------------
  app.get('/api/health', async (req, res) => {
    try {
      // This will wake up MySQL if it's sleeping
      await db.authenticate();
      res.status(200).json({
        status: 'OK',
        message: 'Server & MySQL are alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV,
      });
    } catch (err) {
      console.error('[HEALTH CHECK] MySQL connection failed:', err.message);
      res.status(503).json({
        status: 'ERROR',
        message: 'MySQL connection failed',
        error: err.message,
      });
    }
  });
}
module.exports = { registerHealthRoutes };
