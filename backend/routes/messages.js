const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { emitConversationUpdate } = require('../utils/conversations');
const { resolveProfileImage } = require('../utils/images');
const { sendToUsers } = require('../services/pushService');

// Get messages between two users
router.get('/conversation/:contactId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    const { limit = 50, before } = req.query;

    const fetchLimit = parseInt(limit, 10) + 1;
    const params = [userId, contactId, contactId, userId];
    if (before) {
      params.push(before);
    }
    params.push(fetchLimit);

    const query = `
      SELECT m.*, u.name as sender_name, u.profile_image AS sender_profileImage
      FROM Messages m
      JOIN Users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
         ${before ? 'AND m.created_at < ?' : ''}
      ORDER BY m.created_at DESC
      OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
    `;

    const result = await executeQuery(query, params);

    // Mark messages as read
    const markReadQuery = `
      UPDATE Messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `;

    await executeQuery(markReadQuery, [contactId, userId]);

    const hasMore = result.recordset.length === fetchLimit;
    const sliced = hasMore
      ? result.recordset.slice(0, fetchLimit - 1)
      : result.recordset;

    const formatted = await Promise.all(
      sliced
        .reverse()
        .map(async m => ({
          ...m,
          sender_profileImage: await resolveProfileImage(m.sender_profileImage),
          attachments: m.attachments ? JSON.parse(m.attachments) : []
        }))
    );

    res.json({
      messages: formatted,
      nextCursor: hasMore ? formatted[0]?.created_at : null,
      hasMore
    });

  } catch (error) {
    console.error('Messages fetch error:', error);
    next(error);
  }
});

// Send a message
router.post('/send', authenticateToken, async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, messageType = 'text', attachments = [] } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    const insertQuery = `
      DECLARE @Inserted TABLE (
        id INT, sender_id INT, receiver_id INT, content NVARCHAR(MAX),
        message_type NVARCHAR(20), attachments NVARCHAR(MAX),
        is_read BIT, created_at DATETIME
      );

      INSERT INTO Messages (sender_id, receiver_id, content, message_type, attachments, is_read, created_at)
      OUTPUT INSERTED.id, INSERTED.sender_id, INSERTED.receiver_id, INSERTED.content,
             INSERTED.message_type, INSERTED.attachments, INSERTED.is_read, INSERTED.created_at
      INTO @Inserted
      VALUES (?, ?, ?, ?, ?, 0, GETUTCDATE());

      SELECT i.*, u.name AS sender_name, u.profile_image AS sender_profileImage
      FROM @Inserted i
      JOIN Users u ON u.id = i.sender_id;
    `;
    const { recordset } = await executeQuery(insertQuery, [
      senderId,
      receiverId,
      content,
      messageType,
      JSON.stringify(attachments),
    ]);

    if (!recordset[0]) {
      return res.status(500).json({ message: 'Failed to save message' });
    }

    const savedMessage = {
      ...recordset[0],
      attachments: recordset[0].attachments
        ? JSON.parse(recordset[0].attachments)
        : [],
    };
    savedMessage.sender_profileImage = await resolveProfileImage(savedMessage.sender_profileImage);
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('private-message', savedMessage);
      io.to(`user:${senderId}`).emit('private-message', savedMessage);
    }

    const notificationBody =
      savedMessage.content?.trim() ||
      (savedMessage.attachments.length ? 'Sent an attachment' : '');
    sendToUsers([receiverId], {
      title: savedMessage.sender_name,
      body: notificationBody,
      data: { chatType: 'direct', userId: senderId }
    }).catch(console.error);

    // Update conversation state for sender (mark as read)
    const convUpdate = `
      MERGE conversation_users AS target
      USING (SELECT ? AS user_id, 'direct' AS conversation_type, ? AS conversation_id) AS source
      ON target.user_id=source.user_id AND target.conversation_type=source.conversation_type AND target.conversation_id=source.conversation_id
      WHEN MATCHED THEN UPDATE SET last_read_at=GETUTCDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, conversation_type, conversation_id, last_read_at) VALUES (?, 'direct', ?, GETUTCDATE());
    `;
    await executeQuery(convUpdate, [senderId, receiverId, senderId, receiverId]);

    await emitConversationUpdate(io, senderId, 'direct', receiverId);
    await emitConversationUpdate(io, receiverId, 'direct', senderId);

    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(savedMessage);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
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

    const convUpdate = `
      MERGE conversation_users AS target
      USING (SELECT ? AS user_id, 'direct' AS conversation_type, ? AS conversation_id) AS source
      ON target.user_id=source.user_id AND target.conversation_type=source.conversation_type AND target.conversation_id=source.conversation_id
      WHEN MATCHED THEN UPDATE SET last_read_at=GETUTCDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, conversation_type, conversation_id, last_read_at) VALUES (?, 'direct', ?, GETUTCDATE());
    `;
    await executeQuery(convUpdate, [userId, contactId, userId, contactId]);

    await emitConversationUpdate(req.app.get('io'), userId, 'direct', contactId);

    res.json({ message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('Mark messages read error:', error);
    next(error);
  }
});

router.put('/:messageId', authenticateToken, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const query = `
      UPDATE Messages
      SET content = ?, edited_at = GETUTCDATE()
      OUTPUT INSERTED.id, INSERTED.sender_id, INSERTED.receiver_id,
             INSERTED.content, INSERTED.message_type, INSERTED.attachments,
             INSERTED.is_read, INSERTED.created_at, INSERTED.edited_at
      WHERE id = ? AND sender_id = ?;
    `;
    const { recordset } = await executeQuery(query, [content, messageId, userId]);
    if (!recordset.length) return res.status(404).json({ message: 'Message not found or unauthorized' });

    const updatedMessage = {
      ...recordset[0],
      attachments: recordset[0].attachments
        ? JSON.parse(recordset[0].attachments)
        : [],
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${updatedMessage.receiver_id}`).emit('private-message-edit', updatedMessage);
      io.to(`user:${updatedMessage.sender_id}`).emit('private-message-edit', updatedMessage);
    }

    res.json(updatedMessage);
  } catch (err) {
    next(err);
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

