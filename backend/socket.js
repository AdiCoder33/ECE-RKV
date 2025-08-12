const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = user;
      next();
    });
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);
    if (count === 0) {
      io.emit('user_online', userId);
    }

    socket.on('join-room', (room) => {
      if (room) {
        socket.join(room);
      }
    });

    socket.on('chat-message', ({ room, message }) => {
      if (room && message) {
        io.to(room).emit('chat-message', message);
      }
    });

    socket.on('private-message', ({ to, message }) => {
      if (to && message) {
        io.to(`user:${to}`).emit('private-message', message);
      }
    });

    socket.on('typing', ({ to, room }) => {
      if (to) {
        io.to(`user:${to}`).emit('typing', { from: userId });
      } else if (room) {
        socket.to(room).emit('typing', { from: userId });
      }
    });

    socket.on('stop_typing', ({ to, room }) => {
      if (to) {
        io.to(`user:${to}`).emit('stop_typing', { from: userId });
      } else if (room) {
        socket.to(room).emit('stop_typing', { from: userId });
      }
    });

    socket.on('disconnect', () => {
      const current = onlineUsers.get(userId) || 0;
      if (current <= 1) {
        onlineUsers.delete(userId);
        io.emit('user_offline', userId);
      } else {
        onlineUsers.set(userId, current - 1);
      }
    });
  });

  return io;
}

module.exports = { setupSocket };
