import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
        (client.handshake.query?.token as string);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      (client as any).userId = payload.sub;
      (client as any).role = payload.role;
      (client as any).gameId = payload.gameId;

      // Disconnect previous socket for this user if exists
      const existingSocket = this.connectedUsers.get(payload.sub);
      if (existingSocket && existingSocket.id !== client.id) {
        existingSocket.disconnect();
      }

      this.connectedUsers.set(payload.sub, client);

      if (payload.gameId) {
        client.join(`game:${payload.gameId}`);

        // Count unique users, not sockets
        const count = this.getConnectedPlayersCount(payload.gameId);
        this.server.to(`game:${payload.gameId}`).emit(WS_EVENTS.PLAYER_JOINED, {
          connectedPlayers: count,
        });

        this.server.to('admin').emit(WS_EVENTS.ADMIN_UPDATE, {
          gameId: payload.gameId,
          connectedPlayers: count,
          timestamp: Date.now(),
        });
      }

      if (payload.role === 'ADMIN') {
        client.join('admin');
      }

      console.log(
        `Client connected: userId=${payload.sub}, role=${payload.role}, gameId=${payload.gameId}`,
      );
    } catch (error) {
      console.error('WebSocket auth error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    const gameId = (client as any).gameId;
    if (userId) {
      this.connectedUsers.delete(userId);

      // Notify remaining players about updated count
      if (gameId) {
        const count = this.getConnectedPlayersCount(gameId);
        this.server.to(`game:${gameId}`).emit(WS_EVENTS.PLAYER_JOINED, {
          connectedPlayers: count,
        });
        this.server.to('admin').emit(WS_EVENTS.ADMIN_UPDATE, {
          gameId,
          connectedPlayers: count,
          timestamp: Date.now(),
        });
      }

      console.log(`Client disconnected: userId=${userId}`);
    }
  }

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
    let count = 0;
    for (const [userId, socket] of this.connectedUsers.entries()) {
      if ((socket as any).gameId === gameId && socket.connected) {
        count++;
      }
    }
    return count;
  }
}
