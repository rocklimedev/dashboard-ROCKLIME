const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(file, dependencies) {
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    module, exports: module.exports, process, console,
    require(id) {
      assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return module.exports;
}

test("app composition preserves middleware, API, health and error handler order", () => {
  const calls = [];
  const app = { set: (...args) => calls.push(args) };
  const io = {};
  const { createApp } = load("app.js", {
    express: () => app,
    "./middleware/configure-app": { configureApp: (value, socket) => {
      assert.equal(value, app); assert.equal(socket, io); calls.push("middleware");
    } },
    "./routes": { registerRoutes: () => calls.push("routes") },
    "./routes/health.route": { registerHealthRoutes: () => calls.push("health") },
    "./middleware/error-handlers": { registerErrorHandlers: () => calls.push("errors") },
  });
  assert.equal(createApp({ io }), app);
  assert.deepEqual(calls, [["trust proxy", 1], "middleware", "routes", "health", "errors"]);
});

test("route registration retains all API mounts and limiter ordering", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../routes/index.js"), "utf8");
  const apiLimiter = {}, burstLimiter = {};
  const dependencies = { "../middleware/rateLimit": { apiLimiter, burstLimiter } };
  for (const match of source.matchAll(/require\("(\.\.\/modules\/[^\"]+)"\)/g)) dependencies[match[1]] = { route: match[1] };
  const calls = [];
  load("routes/index.js", dependencies).registerRoutes({ use: (...args) => calls.push(args) });
  assert.equal(calls.length, 42);
  assert.deepEqual(calls.slice(0, 4), [
    ["/api", apiLimiter], ["/api/carts", burstLimiter],
    ["/api/order", burstLimiter], ["/api/quotation", burstLimiter],
  ]);
  for (const [url, file] of [
    ["/api/zoho", "zoho/zoho.route"],
    ["/api/cliq", "zoho/cliq/cliq.route"],
    ["/api/crm", "crm/crm.route"],
  ]) assert.equal(calls.find(call => call[0] === url)[1].route, `../modules/${file}`);
  assert.equal(calls.at(-1)[0], "/api/public");
  assert.equal(calls.at(-1)[1], burstLimiter);
});

test("bootstrap attaches Express before Socket.IO and starts each service once", () => {
  const calls = [];
  const app = { locals: {} }, io = {};
  const httpServer = { listen(port, host) { calls.push(["listen", port, host]); } };
  const { bootstrap } = load("bootstrap.js", {
    http: { createServer(value) { assert.equal(value, app); calls.push("http"); return httpServer; } },
    "./app": { createApp: () => { calls.push("app"); return app; } },
    "./socket/create-socket-server": {
      createSocketServer(value) { assert.equal(value, httpServer); calls.push("socket"); return io; },
      initializeSockets(value) { assert.equal(value, io); calls.push("handlers"); },
    },
    "./config/dbMongo": () => calls.push("mongo"),
    "./config/keys": { port: 4000 },
    "./jobs/scheduled-jobs": { startScheduledJobs: () => calls.push("jobs") },
    "./jobs/keep-alive": { startKeepAlive: () => calls.push("keepAlive") },
  });
  const result = bootstrap();
  assert.equal(result.app, app);
  assert.equal(result.httpServer, httpServer);
  assert.equal(result.io, io);
  assert.equal(app.locals.io, io);
  assert.deepEqual(calls, ["app", "http", "socket", "mongo", "jobs", "handlers", "keepAlive", ["listen", 4000, "0.0.0.0"]]);
});

test("health routes report database availability without starting the server", async () => {
  let unavailable = false;
  const handlers = {};
  load("routes/health.route.js", { "../config/database": { authenticate: async () => {
    if (unavailable) throw new Error("offline");
  } } }).registerHealthRoutes({ get: (url, handler) => { handlers[url] = handler; } });
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  handlers["/health"]({}, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.status, "OK");
  await handlers["/api/health"]({}, res);
  assert.equal(res.code, 200);
  unavailable = true;
  await handlers["/api/health"]({}, res);
  assert.equal(res.code, 503);
  assert.equal(res.body.error, "offline");
});
