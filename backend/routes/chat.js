const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { emitConversationUpdate } = require('../utils/conversations');
const { sendToUsers } = require('../services/pushService');

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
      LIMIT ?
    `;

    const [rows] = await executeQuery(query, params);

    const hasMore = rows.length === fetchLimit;
    const sliced = hasMore ? rows.slice(0, fetchLimit - 1) : rows;

    const formatted = sliced
      .map(msg => ({
        id: msg.id.toString(),
        senderId: Number(msg.sender_id),
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
    const [membership] = await executeQuery(
      'SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'User is not a member of this group' });
    }
    const [insertResult] = await executeQuery(
      'INSERT INTO chat_messages (group_id, sender_id, content, attachments, timestamp) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())',
      [groupId, userId, content.trim(), JSON.stringify(attachments)]
    );

    const [rows] = await executeQuery(
      'SELECT cm.id, cm.group_id, cm.sender_id, cm.content, cm.timestamp, cm.attachments, u.name AS sender_name, u.role AS sender_role, u.profile_image AS sender_profileImage FROM chat_messages cm JOIN users u ON u.id = cm.sender_id WHERE cm.id = ?',
      [insertResult.insertId]
    );

    if (!rows || rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create message' });
    }

    const formatted = {
      ...rows[0],
      id: rows[0].id.toString(),
      senderId: Number(rows[0].sender_id),
      groupId: rows[0].group_id.toString(),
      attachments: rows[0].attachments ? JSON.parse(rows[0].attachments) : []
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('chat-message', formatted);
    }

    const [members] = await executeQuery(
      `SELECT gm.user_id, g.name AS group_name
         FROM chat_group_members gm
         JOIN chat_groups g ON gm.group_id = g.id
         WHERE gm.group_id = ?`,
      [groupId]
    );

    sendToUsers(
      members.filter(m => m.user_id !== userId).map(m => m.user_id),
      {
        title: formatted.sender_name,
        body: formatted.content,
        data: { chatType: 'group', groupId, groupName: members[0]?.group_name }
      }
    ).catch(console.error);

    // Update sender's read timestamp and emit conversation updates
    const convUpdate = `
      INSERT INTO conversation_users (user_id, conversation_type, conversation_id, last_read_at, pinned)
      VALUES (?, 'group', ?, UTC_TIMESTAMP(), 0)
      ON DUPLICATE KEY UPDATE last_read_at=UTC_TIMESTAMP();
    `;
    await executeQuery(convUpdate, [userId, groupId]);

    if (io) {
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

router.put('/groups/:groupId/messages/:messageId',
  authenticateToken, async (req, res, next) => {
    try {
      const { groupId, messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      // Ensure sender owns the message and belongs to the group
      await executeQuery(
        'UPDATE chat_messages SET content = ?, edited_at = UTC_TIMESTAMP() WHERE id = ? AND group_id = ? AND sender_id = ?',
        [content, messageId, groupId, userId]
      );
      const [rows] = await executeQuery(
        'SELECT id, group_id, sender_id, content, timestamp, attachments FROM chat_messages WHERE id = ?',
        [messageId]
      );
      if (!rows.length) return res.status(404).json({ message: 'Message not found or unauthorized' });
      const updated = { ...rows[0], attachments: JSON.parse(rows[0].attachments || '[]') };
      req.app.get('io')?.to(`group-${groupId}`).emit('chat-message-edit', updated);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/groups/:groupId/messages/:messageId',
  authenticateToken, async (req, res, next) => {
    try {
      const { groupId, messageId } = req.params;
      const userId = req.user.id;

      // Verify the user is a member of the group
      const [membership] = await executeQuery(
        'SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
      );
      if (!membership.length) {
        return res.status(404).json({ message: 'Message not found or unauthorized' });
      }

      // Mark the message as deleted if the user is the original sender
      const delQuery = `
        UPDATE chat_messages
        SET is_deleted = 1
        WHERE id = ? AND group_id = ? AND sender_id = ? AND is_deleted = 0;
      `;
      const [delResult] = await executeQuery(delQuery, [messageId, groupId, userId]);
      if (!delResult.affectedRows) {
        return res.status(404).json({ message: 'Message not found or unauthorized' });
      }

      req.app.get('io')?.to(`group-${groupId}`).emit('chat-message-delete', {
        id: messageId,
        groupId
      });

      res.json({ message: 'Message deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// Mark group messages as read
router.put('/groups/:groupId/mark-read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const query = `
      INSERT INTO conversation_users (user_id, conversation_type, conversation_id, last_read_at, pinned)
      VALUES (?, 'group', ?, UTC_TIMESTAMP(), 0)
      ON DUPLICATE KEY UPDATE last_read_at=UTC_TIMESTAMP();
    `;
    await executeQuery(query, [userId, groupId]);

    await emitConversationUpdate(req.app.get('io'), userId, 'group', groupId);

    res.json({ message: 'Group messages marked as read' });
  } catch (error) {
    console.error('Group mark-read error:', error);
    next(error);
  }
});

module.exports = router;

