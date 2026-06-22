import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('user:online', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChat = (chatId) => socket?.emit('chat:join', chatId);
export const leaveChat = (chatId) => socket?.emit('chat:leave', chatId);
export const emitTyping = (chatId, userId, username) => socket?.emit('chat:typing', { chatId, userId, username });
export const emitStopTyping = (chatId, userId) => socket?.emit('chat:stopTyping', { chatId, userId });
