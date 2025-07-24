const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get chat messages
router.get('/messages', authenticateToken, async (req, res) => {
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
      SELECT cm.*, u.name as sender_name, u.role as sender_role 
      FROM chat_messages cm 
      JOIN users u ON cm.sender_id = u.id 
      WHERE cm.is_deleted = FALSE AND cm.chat_type = ?
    `;
    let params = [actualChatType];
    
    // Add section filter for section chats
    if (actualChatType === 'section' && userSection) {
      query += ' AND cm.section = ?';
      params.push(userSection);
    }
    
    query += ' ORDER BY cm.timestamp DESC LIMIT 100';
    
    const [messages] = await db.execute(query, params);
    
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
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send chat message
router.post('/messages', authenticateToken, async (req, res) => {
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
    
    const [result] = await db.execute(query, params);
    
    // Fetch the created message with sender details
    const [newMessage] = await db.execute(`
      SELECT cm.*, u.name as sender_name, u.role as sender_role 
      FROM chat_messages cm 
      JOIN users u ON cm.sender_id = u.id 
      WHERE cm.id = ?
    `, [result.insertId]);
    
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
    
    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;