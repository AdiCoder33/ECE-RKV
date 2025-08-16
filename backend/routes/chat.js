const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { emitConversationUpdate } = require('../utils/conversations');

const router = express.Router();

// Get messages for a specific chat group
router.get('/groups/:groupId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { limit = 50, before } = req.query;

    const fetchLimit = parseInt(limit, 10) + 1;
    const params = [userId, groupId];
    if (before) {
      params.push(before);
    }
    params.push(fetchLimit);

    const query = `
      SELECT cm.id, cm.group_id, cm.sender_id, cm.content, cm.timestamp, cm.attachments,
             u.name as sender_name, u.role as sender_role, u.profile_image AS sender_profileImage
      FROM chat_messages cm
      JOIN chat_group_members gm ON gm.group_id = cm.group_id AND gm.user_id = ?
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.group_id = ? AND cm.is_deleted = 0 ${before ? 'AND cm.timestamp < ?' : ''}
      ORDER BY cm.timestamp DESC
      OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
    `;

    const { recordset } = await executeQuery(query, params);

    const hasMore = recordset.length === fetchLimit;
    const sliced = hasMore ? recordset.slice(0, fetchLimit - 1) : recordset;

    const formatted = sliced
      .map(msg => ({
        id: msg.id.toString(),
        senderId: msg.sender_id.toString(),
        senderName: msg.sender_name,
        senderRole: msg.sender_role,
        sender_profileImage: msg.sender_profileImage,
        content: msg.content,
        timestamp: msg.timestamp,
        groupId: msg.group_id.toString(),
        attachments: msg.attachments ? JSON.parse(msg.attachments) : []
      }))
      .reverse();

    res.json({
      messages: formatted,
      nextCursor: hasMore ? formatted[0]?.timestamp : null,
      hasMore
    });
  } catch (error) {
    console.error('Group messages fetch error:', error);
    next(error);
  }
});

// Send message to a specific chat group
router.post('/groups/:groupId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { content, attachments = [] } = req.body;
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

    const insertQuery = `
      DECLARE @Inserted TABLE (
        id INT, group_id INT, sender_id INT,
        content NVARCHAR(MAX), timestamp DATETIME, attachments NVARCHAR(MAX)
      );

      INSERT INTO chat_messages (group_id, sender_id, content, attachments)
      OUTPUT INSERTED.id, INSERTED.group_id, INSERTED.sender_id,
             INSERTED.content, INSERTED.timestamp, INSERTED.attachments
      INTO @Inserted
      VALUES (?, ?, ?, ?);

      SELECT i.*, u.name AS sender_name, u.role AS sender_role,
             u.profile_image AS sender_profileImage
      FROM @Inserted i
      JOIN users u ON u.id = i.sender_id;
    `;
    const { recordset } = await executeQuery(insertQuery, [
      groupId,
      userId,
      content.trim(),
      JSON.stringify(attachments)
    ]);

    if (!recordset || recordset.length === 0) {
      return res.status(500).json({ error: 'Failed to create message' });
    }

    const formatted = {
      ...recordset[0],
      id: recordset[0].id.toString(),
      senderId: recordset[0].sender_id.toString(),
      groupId: recordset[0].group_id.toString(),
      attachments: recordset[0].attachments
        ? JSON.parse(recordset[0].attachments)
        : []
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('chat-message', formatted);
    }

    // Update sender's read timestamp and emit conversation updates
    const convUpdate = `
      MERGE conversation_users AS target
      USING (SELECT ? AS user_id, 'group' AS conversation_type, ? AS conversation_id) AS source
      ON target.user_id=source.user_id AND target.conversation_type=source.conversation_type AND target.conversation_id=source.conversation_id
      WHEN MATCHED THEN UPDATE SET last_read_at=GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, conversation_type, conversation_id, last_read_at) VALUES (?, 'group', ?, GETDATE());
    `;
    await executeQuery(convUpdate, [userId, groupId, userId, groupId]);

    if (io) {
      const { recordset: members } = await executeQuery('SELECT user_id FROM chat_group_members WHERE group_id = ?', [groupId]);
      for (const member of members) {
        await emitConversationUpdate(io, member.user_id, 'group', groupId);
      }
    }

    res.status(201).json(formatted);
  } catch (error) {
    console.error('Group message send error:', error);
    next(error);
  }
});

// Mark group messages as read
router.put('/groups/:groupId/mark-read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const query = `
      MERGE conversation_users AS target
      USING (SELECT ? AS user_id, 'group' AS conversation_type, ? AS conversation_id) AS source
      ON target.user_id=source.user_id AND target.conversation_type=source.conversation_type AND target.conversation_id=source.conversation_id
      WHEN MATCHED THEN UPDATE SET last_read_at=GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, conversation_type, conversation_id, last_read_at) VALUES (?, 'group', ?, GETDATE());
    `;
    await executeQuery(query, [userId, groupId, userId, groupId]);

    await emitConversationUpdate(req.app.get('io'), userId, 'group', groupId);

    res.json({ message: 'Group messages marked as read' });
  } catch (error) {
    console.error('Group mark-read error:', error);
    next(error);
  }
});

module.exports = router;

