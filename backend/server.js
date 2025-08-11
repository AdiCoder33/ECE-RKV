const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/groups');
const timetableRoutes = require('./routes/timetable');
const subjectRoutes = require('./routes/subjects');
const attendanceRoutes = require('./routes/attendance');
const marksRoutes = require('./routes/marks');
const announcementRoutes = require('./routes/announcements');
const analyticsRoutes = require('./routes/analytics');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const notificationRoutes = require('./routes/notifications');

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Database connection
const { connectDB } = require('./config/database');

async function connectToDatabase() {
  try {
    await connectDB();
    console.log('Connected to MSSQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);


const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// make io available to routes
app.set('io', io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// Start server
connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server + Socket.IO running on port ${PORT}`);
  });
});


module.exports = app;
