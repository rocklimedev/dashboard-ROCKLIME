import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Replaces the manual `new Server(httpServer, { cors: {...} })` +
 * require('./socket')(io) + initSocket(io) wiring in the legacy index.js.
 * CORS origins are configured in main.ts via app.enableCors() and here via
 * the @WebSocketGateway cors option - keep both in sync.
 *
 * Port the room-join / notification-emit logic from socket/index.js and
 * socket/support.js into handlers on this class (see
 * docs/MIGRATION_PLAN.md, "Realtime / Socket.IO").
 */
@WebSocketGateway({
  cors: {
    origin: true, // tightened via main.ts corsOrigins list in production
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // TODO: port auth/room-join logic from socket/index.js
    console.log(`[socket] client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[socket] client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(userId).emit(event, payload);
  }
}
