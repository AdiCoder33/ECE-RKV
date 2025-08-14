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
    const { year, semester, section, subjectId } = req.query;
    let query = `
      SELECT u.name AS student_name, u.email, u.roll_number, s.name AS subject, im.marks
      FROM InternalMarks im
      LEFT JOIN Users u ON im.student_id = u.id
      LEFT JOIN Subjects s ON im.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      query += ' AND u.year = ?';
      params.push(year);
    }

    if (semester) {
      query += ' AND u.semester = ?';
      params.push(semester);
    }

    if (section) {
      query += ' AND u.section = ?';
      params.push(section);
    }

    if (subjectId) {
      query += ' AND im.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY u.roll_number';

    const result = await executeQuery(query, params);
    res.json(result.recordset);
  } catch (error) {
    console.error('Get marks error:', error);
    next(error);
  }
});

// Get marks overview for a class and subject
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester, section, subjectId } = req.query;
    if (!year || !semester || !section || !subjectId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `
      SELECT u.id as student_id, u.name as student_name, u.roll_number,
             im.marks, im.max_marks
      FROM classes c
      JOIN student_classes sc ON c.id = sc.class_id
      JOIN users u ON sc.student_id = u.id
      LEFT JOIN InternalMarks im ON im.student_id = u.id AND im.subject_id = ?
      WHERE c.year = ? AND c.semester = ? AND c.section = ?
      ORDER BY u.roll_number
    `;
    const params = [subjectId, year, semester, section];
    const result = await executeQuery(query, params);
    res.json(result.recordset);
  } catch (error) {
    console.error('Marks overview error:', error);
    next(error);
  }
});

// Bulk enter marks
router.post('/bulk', authenticateToken, async (req, res, next) => {
  try {
    const { type, date, marksData } = req.body;
    const enteredBy = Number(req.user.id);
    if (Number.isNaN(enteredBy)) {
      const message = 'Invalid user ID';
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }

    if (!Array.isArray(marksData)) {
      const message = 'marksData must be an array';
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }

    const errors = [];
    const prepared = [];

    // Resolve student and subject IDs for each record
    for (const record of marksData) {
      const { rollNumber, email, subject, maxMarks, marks } = record;

      if (marks == null || isNaN(Number(marks))) {
        errors.push(`Invalid marks for ${email}`);
        continue;
      }

      let student;
      if (rollNumber) {
        student = await executeQuery(
          'SELECT id FROM Users WHERE roll_number = ?',
          [rollNumber]
        );
      }

      if ((!student || !student.recordset.length) && email) {
        student = await executeQuery(
          'SELECT id FROM Users WHERE email = ?',
          [email]
        );
      }

      if (!student || !student.recordset.length) {
        errors.push(`Student not found: ${rollNumber || email}`);
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
      const message = errors.join('; ');
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
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
