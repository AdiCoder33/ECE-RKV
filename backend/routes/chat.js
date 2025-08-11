const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get chat messages
router.get('/messages', authenticateToken, async (req, res, next) => {
  try {
    const { channel, chatType = 'section' } = req.query;
    const userRole = req.user.role;
    const userSection = req.user.section;
    
    // Determine chat type based on channel and user role
    let actualChatType = chatType;
    if (userRole === 'alumni') {
      actualChatType = 'alumni';
    }
    
    // Build query based on chat type
    let query = `
      SELECT TOP 100 cm.*, u.name as sender_name, u.role as sender_role
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.is_deleted = 0 AND cm.chat_type = ?
    `;
    let params = [actualChatType];
    
    // Add section filter for section chats
    if (actualChatType === 'section' && userSection) {
      query += ' AND cm.section = ?';
      params.push(userSection);
    }
    
    query += ' ORDER BY cm.timestamp DESC';

    const { recordset: messages } = await executeQuery(query, params);
    
    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id.toString(),
      senderId: msg.sender_id.toString(),
      senderName: msg.sender_name,
      senderRole: msg.sender_role,
      content: msg.content,
      timestamp: msg.timestamp,
      chatType: msg.chat_type,
      section: msg.section
    })).reverse();
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('Chat messages fetch error:', error);
    next(error);
  }
});

// Send chat message
router.post('/messages', authenticateToken, async (req, res, next) => {
  try {
    const { content, chatType = 'section' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userSection = req.user.section;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Determine actual chat type
    let actualChatType = chatType;
    if (userRole === 'alumni') {
      actualChatType = 'alumni';
    }
    
    // Insert message into database
    const query = `
      INSERT INTO chat_messages (sender_id, content, chat_type, section)
      VALUES (?, ?, ?, ?)
    `;
    const params = [userId, content.trim(), actualChatType, userSection];

    await executeQuery(query, params);

    // Fetch the created message with sender details
    const { recordset: newMessage } = await executeQuery(`
      SELECT cm.*, u.name as sender_name, u.role as sender_role
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = SCOPE_IDENTITY()
    `);

    const formattedMessage = {
      id: newMessage[0].id.toString(),
      senderId: newMessage[0].sender_id.toString(),
      senderName: newMessage[0].sender_name,
      senderRole: newMessage[0].sender_role,
      content: newMessage[0].content,
      timestamp: newMessage[0].timestamp,
      chatType: newMessage[0].chat_type,
      section: newMessage[0].section
    };

    const io = req.app.get('io');
    const room = actualChatType === 'section' ? `section-${userSection}` : actualChatType;
    if (io) {
      io.to(room).emit('chat-message', formattedMessage);
    }

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Chat message send error:', error);
    next(error);
  }
});

module.exports = router;
