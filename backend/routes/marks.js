const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get marks for a student
router.get('/student/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { subjectId, type } = req.query;
    
    let query = `
      SELECT im.*, s.name as subject_name, s.code as subject_code
      FROM InternalMarks im 
      LEFT JOIN Subjects s ON im.subject_id = s.id 
      WHERE im.student_id = ?
    `;
    const params = [studentId];
    
    if (subjectId) {
      query += ' AND im.subject_id = ?';
      params.push(subjectId);
    }
    
    if (type) {
      query += ' AND im.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY im.date DESC';
    
    const result = await executeQuery(query, params);
    res.json(result.recordset);
  } catch (error) {
    console.error('Get student marks error:', error);
    next(error);
  }
});

// Get all marks (for faculty)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { subjectId, studentId, type } = req.query;
    let query = `
      SELECT im.*, u.name as student_name, u.roll_number, s.name as subject_name 
      FROM InternalMarks im 
      LEFT JOIN Users u ON im.student_id = u.id 
      LEFT JOIN Subjects s ON im.subject_id = s.id 
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
    
    const result = await executeQuery(query, params);
    res.json(result.recordset);
  } catch (error) {
    console.error('Get marks error:', error);
    next(error);
  }
});

// Bulk enter marks
router.post('/bulk', authenticateToken, async (req, res, next) => {
  try {
    const { type, date, enteredBy, marksData } = req.body;

    if (!Array.isArray(marksData)) {
      return res.status(400).json({ error: 'marksData must be an array' });
    }

    const errors = [];
    const prepared = [];

    // Resolve student and subject IDs for each record
    for (const record of marksData) {
      const { email, subject, maxMarks, marks } = record;

      const student = await executeQuery(
        'SELECT id FROM Users WHERE email = ?',
        [email]
      );
      if (!student.recordset.length) {
        errors.push(`Student not found: ${email}`);
        continue;
      }

      const subj = await executeQuery(
        'SELECT id FROM Subjects WHERE name = ? OR code = ?',
        [subject, subject]
      );
      if (!subj.recordset.length) {
        errors.push(`Subject not found: ${subject}`);
        continue;
      }

      prepared.push({
        studentId: student.recordset[0].id,
        subjectId: subj.recordset[0].id,
        maxMarks,
        marks
      });
    }

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    // Insert marks
    for (const p of prepared) {
      await executeQuery(
        `INSERT INTO InternalMarks (student_id, subject_id, type, marks, max_marks, date, entered_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())`,
        [p.studentId, p.subjectId, type, p.marks, p.maxMarks, date, enteredBy]
      );
    }

    res.json({ message: 'Marks entered successfully' });
  } catch (error) {
    console.error('Enter marks error:', error);
    next(error);
  }
});

module.exports = router;
