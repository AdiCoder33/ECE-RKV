const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get conversations for a user
router.get('/conversations', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const query = `
      WITH ConversationMessages AS (
        SELECT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END as contact_id,
          MAX(created_at) as last_message_time,
          MAX(id) as last_message_id
        FROM Messages 
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END
      )
      SELECT 
        cm.contact_id,
        u.name as contact_name,
        u.role as contact_role,
        m.content as last_message,
        m.sender_id as last_sender_id,
        cm.last_message_time,
        COUNT(CASE WHEN m2.is_read = 0 AND m2.receiver_id = ? THEN 1 END) as unread_count
      FROM ConversationMessages cm
      JOIN Users u ON u.id = cm.contact_id
      JOIN Messages m ON m.id = cm.last_message_id
      LEFT JOIN Messages m2 ON (m2.sender_id = cm.contact_id AND m2.receiver_id = ?)
      GROUP BY cm.contact_id, u.name, u.role, m.content, m.sender_id, cm.last_message_time
      ORDER BY cm.last_message_time DESC
    `;
    
    const result = await executeQuery(query, [userId, userId, userId, userId, userId, userId]);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Messages conversations fetch error:', error);
    next(error);
  }
});

// Get messages between two users
router.get('/conversation/:contactId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT m.*, u.name as sender_name
      FROM Messages m
      JOIN Users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      OFFSET ? ROWS
      FETCH NEXT ? ROWS ONLY
    `;
    
    const result = await executeQuery(query, [userId, contactId, contactId, userId, offset, limit]);
    
    // Mark messages as read
    const markReadQuery = `
      UPDATE Messages 
      SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `;
    
    await executeQuery(markReadQuery, [contactId, userId]);
    
    res.json(result.recordset.reverse());
    
  } catch (error) {
    console.error('Messages fetch error:', error);
    next(error);
  }
});

// Send a message
router.post('/send', authenticateToken, async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, messageType = 'text' } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    const insertQuery = `
      INSERT INTO Messages (sender_id, receiver_id, content, message_type, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, GETDATE())
    `;
    
    const result = await executeQuery(insertQuery, [senderId, receiverId, content, messageType]);
    
    // Get the inserted message with sender details
    const messageQuery = `
      SELECT m.*, u.name as sender_name
      FROM Messages m
      JOIN Users u ON u.id = m.sender_id
      WHERE m.id = SCOPE_IDENTITY()
    `;
    
    const messageResult = await executeQuery(messageQuery);

    const savedMessage = messageResult.recordset[0];
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('private-message', savedMessage);
      io.to(`user:${senderId}`).emit('private-message', savedMessage);
    }

    res.status(201).json(savedMessage);
    
  } catch (error) {
    console.error('Send message error:', error);
    next(error);
  }
});

// Mark messages as read
router.put('/mark-read/:contactId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    
    const query = `
      UPDATE Messages 
      SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `;
    
    await executeQuery(query, [contactId, userId]);
    res.json({ message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('Mark messages read error:', error);
    next(error);
  }
});

// Delete a message
router.delete('/:messageId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    
    const query = `
      DELETE FROM Messages 
      WHERE id = ? AND sender_id = ?
    `;
    
    const result = await executeQuery(query, [messageId, userId]);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }
    
    res.json({ message: 'Message deleted successfully' });
    
  } catch (error) {
    console.error('Delete message error:', error);
    next(error);
  }
});

module.exports = router;

