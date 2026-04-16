// src/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // Adjust in production
  namespace: 'notifications', // optional: /notifications
})
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private ioInstance: Server;

  afterInit(server: Server) {
    this.ioInstance = server;
    console.log('✅ Notification WebSocket Gateway Initialized');
  }

  // Expose io instance to service
  getIoInstance(): Server {
    return this.ioInstance;
  }

  // Helper to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (this.ioInstance) {
      this.ioInstance.to(userId).emit(event, data);
    }
  }

  // Emit to all (used for global events)
  emitToAll(event: string, data: any) {
    if (this.ioInstance) {
      this.ioInstance.emit(event, data);
    }
  }
}