const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get chat messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { channel } = req.query;
    const userRole = req.user.role;
    
    // Alumni have separate channels
    let allowedChannels = [];
    if (userRole === 'alumni') {
      allowedChannels = ['alumni-general', 'alumni-networking', 'alumni-mentorship'];
    } else {
      allowedChannels = ['general', 'academic', 'announcements'];
    }
    
    if (!allowedChannels.includes(channel)) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    // Mock messages for demo
    const mockMessages = [
      {
        id: 1,
        content: 'Welcome to the chat!',
        sender: 'System',
        role: 'system',
        timestamp: new Date().toISOString(),
        channel: channel
      }
    ];
    
    res.json(mockMessages.filter(msg => msg.channel === channel));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send chat message
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { content, channel } = req.body;
    const userRole = req.user.role;
    
    // Check channel access
    let allowedChannels = [];
    if (userRole === 'alumni') {
      allowedChannels = ['alumni-general', 'alumni-networking', 'alumni-mentorship'];
    } else {
      allowedChannels = ['general', 'academic', 'announcements'];
    }
    
    if (!allowedChannels.includes(channel)) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    // In a real app, save to database
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;