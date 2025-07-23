const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get announcements
router.get('/', authenticateToken, async (req, res) => {
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

// Create announcement
router.post('/', authenticateToken, async (req, res) => {
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

module.exports = router;