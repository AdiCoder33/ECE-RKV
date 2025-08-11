const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get messages for a specific chat group
router.get('/groups/:groupId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const { recordset: messages } = await executeQuery(
      `SELECT TOP 100 cm.id, cm.group_id, cm.sender_id, cm.content, cm.timestamp,
              u.name as sender_name, u.role as sender_role
       FROM chat_messages cm
       JOIN chat_group_members gm ON gm.group_id = cm.group_id AND gm.user_id = ?
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.group_id = ? AND cm.is_deleted = 0
       ORDER BY cm.timestamp DESC`,
      [userId, groupId]
    );

    const formatted = messages.map(msg => ({
      id: msg.id.toString(),
      senderId: msg.sender_id.toString(),
      senderName: msg.sender_name,
      senderRole: msg.sender_role,
      content: msg.content,
      timestamp: msg.timestamp,
      groupId: msg.group_id.toString()
    })).reverse();

    res.json(formatted);
  } catch (error) {
    console.error('Group messages fetch error:', error);
    next(error);
  }
});

// Send message to a specific chat group
router.post('/groups/:groupId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify membership in the group
    const { recordset: membership } = await executeQuery(
      'SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'User is not a member of this group' });
    }

    await executeQuery(
      'INSERT INTO chat_messages (group_id, sender_id, content) VALUES (?, ?, ?)',
      [groupId, userId, content.trim()]
    );

    const { recordset: newMessage } = await executeQuery(
      `SELECT cm.id, cm.group_id, cm.sender_id, cm.content, cm.timestamp,
              u.name as sender_name, u.role as sender_role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = SCOPE_IDENTITY()`
    );

    const formatted = {
      id: newMessage[0].id.toString(),
      senderId: newMessage[0].sender_id.toString(),
      senderName: newMessage[0].sender_name,
      senderRole: newMessage[0].sender_role,
      content: newMessage[0].content,
      timestamp: newMessage[0].timestamp,
      groupId: newMessage[0].group_id.toString()
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('chat-message', formatted);
    }

    res.status(201).json(formatted);
  } catch (error) {
    console.error('Group message send error:', error);
    next(error);
  }
});

module.exports = router;

