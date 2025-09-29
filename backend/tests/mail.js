const net = require("net");

const socket = net.createConnection(465, "static.cmtradingco.com");
socket.on("connect", () => {
  console.log("✅ Connected to SMTP server");
  socket.end();
});
socket.on("error", (err) => {
  console.error("❌ Connection failed:", err);
});
