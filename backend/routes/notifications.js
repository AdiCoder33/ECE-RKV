
const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get notifications for the current user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { recordset } = await executeQuery(`
      SELECT 
        id, 
        title, 
        message, 
        type, 
        is_read, 
        created_at,
        data
      FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.user.id]);
    
    res.json(recordset);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    await executeQuery(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    next(error);
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res, next) => {
  try {
    await executeQuery(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    next(error);
  }
});

// Create notification (for system use)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, message, type, userId, data } = req.body;
    
    const { recordset } = await executeQuery(
      'INSERT INTO notifications (title, message, type, user_id, data) OUTPUT inserted.id VALUES (?, ?, ?, ?, ?)',
      [title, message, type, userId, JSON.stringify(data || {})]
    );
    
    res.status(201).json({ 
      id: recordset[0].id, 
      message: 'Notification created successfully' 
    });
  } catch (error) {
    console.error('Create notification error:', error);
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await executeQuery(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    next(error);
  }
});

module.exports = router;
