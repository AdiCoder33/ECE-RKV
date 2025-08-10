const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get announcements
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await executeQuery(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_active = 1
      ORDER BY a.created_at DESC
    `);
    const rows = result.recordset;
    res.json(rows);
  } catch (error) {
    console.error('Announcements fetch error:', error);
    next(error);
  }
});

// Create announcement
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, content, targetRole, targetSection, targetYear, priority } = req.body;
    
    const result = await executeQuery(
      'INSERT INTO announcements (title, content, author_id, target_role, target_section, target_year, priority) OUTPUT inserted.id VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, req.user.id, targetRole, targetSection, targetYear, priority]
    );

    res.status(201).json({ id: result.recordset[0].id, message: 'Announcement created successfully' });
  } catch (error) {
    console.error('Create announcement error:', error);
    next(error);
  }
});

module.exports = router;
