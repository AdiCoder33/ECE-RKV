const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get attendance records
router.get('/', authenticateToken, async (req, res) => {
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

// Bulk mark attendance
router.post('/bulk', authenticateToken, async (req, res) => {
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

module.exports = router;