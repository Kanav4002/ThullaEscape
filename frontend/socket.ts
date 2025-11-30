import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const token = getToken();
  socket = io((import.meta as any).env.VITE_API_BASE || 'http://localhost:4000', {
    autoConnect: false,
    transports: ['websocket'],
    auth: { token }
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}
