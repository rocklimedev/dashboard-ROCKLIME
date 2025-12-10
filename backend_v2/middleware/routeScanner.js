const listRoutes = (app) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Normal route
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === "router") {
      // Nested router (mounted router)
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: handler.route.path,
          });
        }
      });
    }
  });

  return routes;
};

module.exports = listRoutes;
