const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get attendance records
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { subjectId, date, studentId, classId, startDate, endDate } = req.query;
    let query = `
      SELECT 
        a.*,
        u.name as student_name, 
        u.roll_number, 
        s.name as subject_name,
        s.code as subject_code,
        mb.name as marked_by_name
      FROM attendance a 
      LEFT JOIN users u ON a.student_id = u.id 
      LEFT JOIN subjects s ON a.subject_id = s.id 
      LEFT JOIN users mb ON a.marked_by = mb.id
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
    
    if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (studentId) {
      query += ' AND a.student_id = ?';
      params.push(studentId);
    }
    
    if (classId) {
      query += ` AND a.student_id IN (
        SELECT sc.student_id FROM student_classes sc WHERE sc.class_id = ?
      )`;
      params.push(classId);
    }
    
    query += ' ORDER BY a.date DESC, a.period, u.roll_number';
    
    const [rows] = await db.execute(query, params);
    
    res.json(rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      rollNumber: row.roll_number,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectCode: row.subject_code,
      date: row.date,
      present: row.present,
      period: row.period,
      markedBy: row.marked_by,
      markedByName: row.marked_by_name,
      createdAt: row.created_at
    })));
  } catch (error) {
    console.error('Attendance fetch error:', error);
    next(error);
  }
});

// Get attendance summary
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const { subjectId, classId, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.roll_number,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as present_count,
        ROUND((SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) as attendance_percentage
      FROM users u
      LEFT JOIN attendance a ON u.id = a.student_id
    `;
    
    const params = [];
    let whereConditions = ['u.role = "student"'];
    
    if (subjectId) {
      whereConditions.push('a.subject_id = ?');
      params.push(subjectId);
    }
    
    if (classId) {
      whereConditions.push(`u.id IN (
        SELECT sc.student_id FROM student_classes sc WHERE sc.class_id = ?
      )`);
      params.push(classId);
    }
    
    if (startDate && endDate) {
      whereConditions.push('a.date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    
    query += ' WHERE ' + whereConditions.join(' AND ');
    query += ' GROUP BY u.id ORDER BY u.roll_number';
    
    const [rows] = await db.execute(query, params);
    
    res.json(rows.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      rollNumber: row.roll_number,
      totalClasses: row.total_classes || 0,
      presentCount: row.present_count || 0,
      attendancePercentage: row.attendance_percentage || 0
    })));
  } catch (error) {
    console.error('Attendance summary error:', error);
    next(error);
  }
});

// Bulk mark attendance
router.post('/bulk', authenticateToken, async (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;
