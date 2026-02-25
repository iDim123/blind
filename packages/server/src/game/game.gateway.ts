import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WS_EVENTS } from '@blind/shared';
import { JwtPayload } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, Socket> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token as string;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      (client as any).userId = payload.sub;
      (client as any).role = payload.role;
      (client as any).gameId = payload.gameId;

      this.connectedUsers.set(payload.sub, client);

      // Join game room
      if (payload.gameId) {
        client.join(`game:${payload.gameId}`);
      }

      // Admin room
      if (payload.role === 'ADMIN') {
        // Admin joins all game rooms for observation
        client.join('admin');
      }

      console.log(`Client connected: userId=${payload.sub}, role=${payload.role}`);
    } catch (error) {
      console.error('WebSocket auth error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`Client disconnected: userId=${userId}`);
    }
  }

  // Helper methods for emitting events

  emitToGame(gameId: number, event: string, data: any) {
    this.server.to(`game:${gameId}`).emit(event, data);
  }

  emitToGroup(groupId: number, event: string, data: any) {
    this.server.to(`group:${groupId}`).emit(event, data);
  }

  emitToUser(userId: number, event: string, data: any) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  emitToAdmin(gameId: number, event: string, data: any) {
    this.server.to('admin').emit(event, data);
  }

  joinGroupRoom(userId: number, groupId: number) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.join(`group:${groupId}`);
    }
  }

  getConnectedPlayersCount(gameId: number): number {
    const room = this.server.sockets.adapter.rooms.get(`game:${gameId}`);
    return room ? room.size : 0;
  }
}