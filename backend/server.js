
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
// Allow long-running requests such as large Excel imports
server.setTimeout(15 * 60 * 1000); // 15 minutes
// TODO: Offload heavy processing (e.g., Excel parsing) to a background job queue
// so the API can respond immediately while work continues asynchronously.
const PORT = process.env.PORT || 5000;
const { setupSocket } = require('./socket');
const io = setupSocket(server);
app.set('io', io);

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
const conversationRoutes = require('./routes/conversations');
const uploadRoutes = require('./routes/uploads');
const professorRoutes = require('./routes/professors');
const publicRoutes = require('./routes/public');
const deviceRoutes = require('./routes/devices');
const pushRoutes = require('./routes/push');
const complaintRoutes = require('./routes/complaints');
const { startAttendanceAlertScheduler } = require('./services/attendanceAlertScheduler');

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/internal-marks', marksRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/public', publicRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/complaints', complaintRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// Start server
connectToDatabase().then(() => {
  startAttendanceAlertScheduler();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
