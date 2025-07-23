const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get internal marks
router.get('/', authenticateToken, async (req, res) => {
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

// Bulk enter internal marks
router.post('/bulk', authenticateToken, async (req, res) => {
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

module.exports = router;