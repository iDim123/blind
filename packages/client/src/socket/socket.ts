import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  // Return existing connected or connecting socket
  if (socket && (socket.connected || socket.active)) {
    return socket;
  }

  // Disconnect old broken socket if any
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = useAuthStore.getState().token;
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

  socket = io(wsUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('WebSocket connected, id:', socket?.id));
  socket.on('disconnect', (reason) => console.log('WebSocket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('WebSocket error:', err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
