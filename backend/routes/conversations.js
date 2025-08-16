const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');
const { emitConversationUpdate } = require('../utils/conversations');

// Get all conversations for a user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const directQuery = `
      DECLARE @userId INT = ?;
      WITH conv AS (
        SELECT CASE WHEN sender_id=@userId THEN receiver_id ELSE sender_id END AS contact_id,
               MAX(created_at) AS last_activity,
               MAX(id) AS last_message_id
        FROM messages
        WHERE sender_id=@userId OR receiver_id=@userId
        GROUP BY CASE WHEN sender_id=@userId THEN receiver_id ELSE sender_id END
      )
      SELECT
        'direct' AS type,
        conv.contact_id AS id,
        u.name AS title,
        u.profile_image AS avatar,
        m.content AS last_message,
        conv.last_activity AS last_activity,
        (
          SELECT COUNT(*) FROM messages m2
          WHERE m2.sender_id=conv.contact_id AND m2.receiver_id=@userId
            AND m2.created_at > ISNULL(cu.last_read_at,'1900-01-01')
        ) AS unread_count,
        ISNULL(cu.pinned,0) AS pinned
      FROM conv
      JOIN users u ON u.id=conv.contact_id
      LEFT JOIN messages m ON m.id=conv.last_message_id
      LEFT JOIN conversation_users cu ON cu.user_id=@userId AND cu.conversation_type='direct' AND cu.conversation_id=conv.contact_id;
    `;

    const groupQuery = `
      DECLARE @userId INT = ?;
      SELECT
        'group' AS type,
        g.id AS id,
        g.name AS title,
        NULL AS avatar,
        cm.content AS last_message,
        conv.last_activity,
        (
          SELECT COUNT(*) FROM chat_messages cm2
          WHERE cm2.group_id=g.id
            AND cm2.timestamp > ISNULL(cu.last_read_at,'1900-01-01')
            AND cm2.sender_id <> @userId
        ) AS unread_count,
        ISNULL(cu.pinned,0) AS pinned
      FROM chat_group_members gm
      JOIN chat_groups g ON g.id=gm.group_id
      LEFT JOIN (
        SELECT group_id, MAX(timestamp) AS last_activity, MAX(id) AS last_message_id
        FROM chat_messages GROUP BY group_id
      ) conv ON conv.group_id = g.id
      LEFT JOIN chat_messages cm ON cm.id = conv.last_message_id
      LEFT JOIN conversation_users cu ON cu.user_id=@userId AND cu.conversation_type='group' AND cu.conversation_id=g.id
      WHERE gm.user_id=@userId;
    `;

    const [{ recordset: direct }, { recordset: groups }] = await Promise.all([
      executeQuery(directQuery, [userId]),
      executeQuery(groupQuery, [userId])
    ]);

    const conversations = [...direct, ...groups].map(c => ({
      type: c.type,
      id: c.id.toString(),
      title: c.title,
      avatar: c.avatar,
      lastMessage: c.last_message,
      lastActivity: c.last_activity,
      unreadCount: c.unread_count,
      pinned: c.pinned
    }));
    conversations.sort((a, b) => {
      if (b.pinned !== a.pinned) return b.pinned - a.pinned;
      return new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0);
    });

    res.json(conversations);
  } catch (error) {
    console.error('Conversations fetch error:', error);
    next(error);
  }
});

// Pin a conversation
router.post('/:type/:id/pin', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;

    const query = `
      MERGE conversation_users AS target
      USING (SELECT ? AS user_id, ? AS conversation_type, ? AS conversation_id) AS source
      ON target.user_id=source.user_id AND target.conversation_type=source.conversation_type AND target.conversation_id=source.conversation_id
      WHEN MATCHED THEN UPDATE SET pinned=1
      WHEN NOT MATCHED THEN
        INSERT (user_id, conversation_type, conversation_id, pinned) VALUES (?, ?, ?, 1);
    `;

    await executeQuery(query, [userId, type, id, userId, type, id]);

    await emitConversationUpdate(req.app.get('io'), userId, type, id);

    res.json({ message: 'Conversation pinned' });
  } catch (error) {
    console.error('Pin conversation error:', error);
    next(error);
  }
});

// Unpin a conversation
router.post('/:type/:id/unpin', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;

    const query = `
      MERGE conversation_users AS target
      USING (SELECT ? AS user_id, ? AS conversation_type, ? AS conversation_id) AS source
      ON target.user_id=source.user_id AND target.conversation_type=source.conversation_type AND target.conversation_id=source.conversation_id
      WHEN MATCHED THEN UPDATE SET pinned=0
      WHEN NOT MATCHED THEN
        INSERT (user_id, conversation_type, conversation_id, pinned) VALUES (?, ?, ?, 0);
    `;

    await executeQuery(query, [userId, type, id, userId, type, id]);

    await emitConversationUpdate(req.app.get('io'), userId, type, id);

    res.json({ message: 'Conversation unpinned' });
  } catch (error) {
    console.error('Unpin conversation error:', error);
    next(error);
  }
});

module.exports = router;
