const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit a complaint
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, type, description, isAnonymous } = req.body;
    await executeQuery(
      'INSERT INTO complaints (student_id, type, title, description, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, type, title, description, isAnonymous]
    );
    res.status(201).json({ message: 'Complaint submitted successfully' });
  } catch (error) {
    console.error('Create complaint error:', error);
    next(error);
  }
});

// Get complaints
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await executeQuery(`
      SELECT c.id, c.student_id, c.type, c.title, c.description, c.is_anonymous, c.created_at, u.name AS student_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Fetch complaints error:', error);
    next(error);
  }
});

module.exports = router;
