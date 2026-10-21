function registerErrorHandlers(app) {
  app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  // ------------------- Global Error Handler -------------------
  app.use((err, req, res, next) => {
    console.error("[GLOBAL ERROR]", err.stack || err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message,
    });
  });

}
module.exports = { registerErrorHandlers };
