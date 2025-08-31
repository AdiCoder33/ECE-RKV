const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Authorization helper to ensure the user has one of the required roles
const requireRole = roles => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Create a new extra class
router.post('/', authenticateToken, requireRole(['professor', 'hod']), async (req, res, next) => {
  try {
    const { subjectId, classId, date, startTime, endTime } = req.body;

    if (!subjectId || !classId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'subjectId, classId, date, startTime and endTime are required' });
    }

    const [result] = await executeQuery(
      'INSERT INTO extra_classes (subject_id, class_id, date, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [subjectId, classId, date, startTime, endTime, req.user.id]
    );

    res.status(201).json({
      id: result.insertId,
      subjectId,
      classId,
      date,
      startTime,
      endTime,
      createdBy: req.user.id,
    });
  } catch (error) {
    console.error('Create extra class error:', error);
    next(error);
  }
});

// Get extra classes for a professor on a given date
router.get('/', authenticateToken, requireRole(['professor', 'hod']), async (req, res, next) => {
  try {
    const { professorId, date } = req.query;

    if (!professorId || !date) {
      return res.status(400).json({ error: 'professorId and date are required' });
    }

    const result = await executeQuery(
      `SELECT ec.*, s.name AS subject_name
       FROM extra_classes ec
       LEFT JOIN subjects s ON ec.subject_id = s.id
       WHERE ec.created_by = ? AND ec.date = ?
       ORDER BY ec.start_time`,
      [professorId, date]
    );

    res.json(result.recordset || []);
  } catch (error) {
    console.error('Fetch extra classes error:', error);
    next(error);
  }
});

module.exports = router;

