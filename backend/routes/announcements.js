// backend/routes/announcements.js
const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/announcements
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await executeQuery(
      `SELECT a.*, u.name AS authorName
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.is_active = 1
       ORDER BY a.created_at DESC`
    );

    res.json(result.recordset);
  } catch (error) {
    console.error('Announcements fetch error:', error);
    next(error);
  }
});

// POST /api/announcements
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, content, targetRole, targetYear, priority } = req.body;

    await executeQuery(
      `INSERT INTO announcements (title, content, author_id, target_role, target_year, priority, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, GETDATE())`,
      [title, content, req.user.id, targetRole || null, targetYear || null, priority || 'low']
    );

    // Insert a notification in DB (optional)
    const notification = {
      title,
      message: content,
      type: 'info',
      is_read: false,
      created_at: new Date()
    };

    // Send real-time update
    const io = req.app.get('io');
    io.emit('newAnnouncement', notification);

    res.status(201).json({ message: 'Announcement created and notification sent' });
  } catch (error) {
    next(error);
  }
});



module.exports = router;
