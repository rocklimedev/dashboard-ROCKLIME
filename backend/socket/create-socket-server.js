const { Server } = require('socket.io');
const { initSocket } = require('../modules/engagement/notification.controller');

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:5173',
        'https://dashboard-rocklime.vercel.app',
        'https://cmtradingco.vercel.app',
        'https://dashboard-cmtradingco.vercel.app',
        'http://erp.cmtradingco.com',
        'https://erp.cmtradingco.com',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
  });

  return io;
}

function initializeSockets(io) {
  require('../socket')(io);
  initSocket(io);
}
module.exports = { createSocketServer, initializeSockets };
