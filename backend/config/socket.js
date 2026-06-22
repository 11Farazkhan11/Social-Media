const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Join a chat room
    socket.on('chat:join', (chatId) => {
      socket.join(chatId);
    });

    // Leave a chat room
    socket.on('chat:leave', (chatId) => {
      socket.leave(chatId);
    });

    // Typing indicator
    socket.on('chat:typing', ({ chatId, userId, username }) => {
      socket.to(chatId).emit('chat:typing', { userId, username });
    });

    socket.on('chat:stopTyping', ({ chatId, userId }) => {
      socket.to(chatId).emit('chat:stopTyping', { userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

export const getSocketId = (userId) => onlineUsers.get(userId);
export const getOnlineUsers = () => Array.from(onlineUsers.keys());
