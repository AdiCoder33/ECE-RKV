const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const pushService = require('../services/pushService');
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
    if (!['admin', 'hod', 'professor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, content, targetRole, targetSection, targetYear, priority } = req.body;

    const result = await executeQuery(
      'INSERT INTO announcements (title, content, author_id, target_role, target_section, target_year, priority) OUTPUT inserted.id VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, req.user.id, targetRole, targetSection, targetYear, priority]
    );

    const newId = result.recordset[0].id;

    // Determine recipients based on targeting parameters
    const conditions = [];
    const params = [];
    if (targetRole) {
      conditions.push('role = ?');
      params.push(targetRole);
    }
    if (targetYear) {
      conditions.push('year = ?');
      params.push(targetYear);
    }
    if (targetSection) {
      conditions.push('section = ?');
      params.push(targetSection);
    }

    const usersQuery = `SELECT id FROM users${conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''}`;
    const { recordset: recipients } = await executeQuery(usersQuery, params);

    const snippet = content.substring(0, 100);
    const notificationPromises = recipients.map((user) =>
      executeQuery(
        'INSERT INTO notifications (title, message, type, user_id, data) VALUES (?, ?, ?, ?, ?)',
        [title, snippet, 'info', user.id, JSON.stringify({ announcementId: newId })]
      )
    );
    await Promise.all(notificationPromises);

    pushService
      .sendToUsers(
        recipients.map((u) => u.id),
        { title, body: snippet, data: { announcementId: newId } }
      )
      .catch((err) => console.error('Push notification error:', err));

    res.status(201).json({ id: newId, message: 'Announcement created successfully' });
  } catch (error) {
    console.error('Create announcement error:', error);
    next(error);
  }
});

// Update announcement
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    if (!['admin', 'hod', 'professor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, content, priority, targetRole, targetSection, targetYear, isActive } = req.body;
    const fields = [];
    const params = [];

    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      fields.push('content = ?');
      params.push(content);
    }
    if (priority !== undefined) {
      fields.push('priority = ?');
      params.push(priority);
    }
    if (targetRole !== undefined) {
      fields.push('target_role = ?');
      params.push(targetRole);
    }
    if (targetSection !== undefined) {
      fields.push('target_section = ?');
      params.push(targetSection);
    }
    if (targetYear !== undefined) {
      fields.push('target_year = ?');
      params.push(targetYear);
    }
    if (isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(isActive);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    params.push(req.params.id);
    await executeQuery(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Update announcement error:', error);
    next(error);
  }
});

// Deactivate announcement
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    if (!['admin', 'hod', 'professor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await executeQuery('UPDATE announcements SET is_active = 0 WHERE id = ?', [req.params.id]);

    res.json({ message: 'Announcement deactivated successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    next(error);
  }
});

module.exports = router;
