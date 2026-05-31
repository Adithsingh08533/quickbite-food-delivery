import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

import { api } from '../services/api';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const authHeader = api.defaults.headers.common['Authorization'] as string;
    const token = authHeader ? authHeader.split(' ')[1] : null;
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      set({ isConnected: false });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
