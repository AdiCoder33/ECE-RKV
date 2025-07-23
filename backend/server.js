const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Database connection
const db = require('./config/database');

async function connectToDatabase() {
  try {
    await db.execute('SELECT 1');
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Legacy routes (keep for compatibility)
const { authenticateToken } = require('./middleware/auth');

// User Management Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, department, year, section, roll_number, phone, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, role, department, year, section, rollNumber, phone } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, department, year, section, roll_number, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, department, year, section, rollNumber, phone]
    );
    
    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email or roll number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Subject Management Routes
app.get('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.*, u.name as professor_name 
      FROM subjects s 
      LEFT JOIN users u ON s.professor_id = u.id 
      ORDER BY s.year, s.semester, s.name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const { name, code, year, semester, credits, professorId, type, maxMarks } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO subjects (name, code, year, semester, credits, professor_id, type, max_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, year, semester, credits, professorId, type, maxMarks]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Subject created successfully' });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendance Routes
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { subjectId, date, studentId } = req.query;
    let query = `
      SELECT a.*, u.name as student_name, u.roll_number, s.name as subject_name 
      FROM attendance a 
      LEFT JOIN users u ON a.student_id = u.id 
      LEFT JOIN subjects s ON a.subject_id = s.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (subjectId) {
      query += ' AND a.subject_id = ?';
      params.push(subjectId);
    }
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    if (studentId) {
      query += ' AND a.student_id = ?';
      params.push(studentId);
    }
    
    query += ' ORDER BY a.date DESC, a.period';
    
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attendance/bulk', authenticateToken, async (req, res) => {
  try {
    const { subjectId, date, period, attendanceData, markedBy } = req.body;
    
    // Delete existing attendance for the same subject, date, and period
    await db.execute(
      'DELETE FROM attendance WHERE subject_id = ? AND date = ? AND period = ?',
      [subjectId, date, period]
    );
    
    // Insert new attendance records
    const insertPromises = attendanceData.map(record => {
      return db.execute(
        'INSERT INTO attendance (student_id, subject_id, date, present, period, marked_by) VALUES (?, ?, ?, ?, ?, ?)',
        [record.studentId, subjectId, date, record.present, period, markedBy]
      );
    });
    
    await Promise.all(insertPromises);
    
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Internal Marks Routes
app.get('/api/internal-marks', authenticateToken, async (req, res) => {
  try {
    const { subjectId, studentId, type } = req.query;
    let query = `
      SELECT im.*, u.name as student_name, u.roll_number, s.name as subject_name 
      FROM internal_marks im 
      LEFT JOIN users u ON im.student_id = u.id 
      LEFT JOIN subjects s ON im.subject_id = s.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (subjectId) {
      query += ' AND im.subject_id = ?';
      params.push(subjectId);
    }
    
    if (studentId) {
      query += ' AND im.student_id = ?';
      params.push(studentId);
    }
    
    if (type) {
      query += ' AND im.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY im.date DESC';
    
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get internal marks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/internal-marks/bulk', authenticateToken, async (req, res) => {
  try {
    const { subjectId, type, marksData, maxMarks, date, enteredBy } = req.body;
    
    // Delete existing marks for the same subject and type
    await db.execute(
      'DELETE FROM internal_marks WHERE subject_id = ? AND type = ?',
      [subjectId, type]
    );
    
    // Insert new marks
    const insertPromises = marksData.map(record => {
      return db.execute(
        'INSERT INTO internal_marks (student_id, subject_id, type, marks, max_marks, date, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.studentId, subjectId, type, record.marks, maxMarks, date, enteredBy]
      );
    });
    
    await Promise.all(insertPromises);
    
    res.json({ message: 'Internal marks entered successfully' });
  } catch (error) {
    console.error('Enter internal marks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Announcements Routes
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.*, u.name as author_name 
      FROM announcements a 
      LEFT JOIN users u ON a.author_id = u.id 
      WHERE a.is_active = 1 
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const { title, content, targetRole, targetSection, targetYear, priority } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO announcements (title, content, author_id, target_role, target_section, target_year, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, req.user.id, targetRole, targetSection, targetYear, priority]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Announcement created successfully' });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Routes
app.get('/api/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { chatType, section } = req.query;
    let query = `
      SELECT cm.*, u.name as sender_name 
      FROM chat_messages cm 
      LEFT JOIN users u ON cm.sender_id = u.id 
      WHERE cm.chat_type = ?
    `;
    const params = [chatType];
    
    if (section && chatType === 'section') {
      query += ' AND cm.section = ?';
      params.push(section);
    }
    
    query += ' ORDER BY cm.timestamp DESC LIMIT 50';
    
    const [rows] = await db.execute(query, params);
    res.json(rows.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { content, chatType, section } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO chat_messages (sender_id, content, chat_type, section) VALUES (?, ?, ?, ?)',
      [req.user.id, content, chatType, section]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics Routes
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const [userStats] = await db.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const [subjectStats] = await db.execute('SELECT COUNT(*) as total_subjects FROM subjects');
    const [attendanceStats] = await db.execute(`
      SELECT 
        AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) as avg_attendance 
      FROM attendance 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    
    res.json({
      userStats,
      totalSubjects: subjectStats[0].total_subjects,
      avgAttendance: Math.round(attendanceStats[0].avg_attendance * 100) / 100
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;