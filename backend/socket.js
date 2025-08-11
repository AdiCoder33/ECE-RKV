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

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

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
  });

  return io;
}

module.exports = { setupSocket };
