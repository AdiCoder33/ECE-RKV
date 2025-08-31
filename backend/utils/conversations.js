const { executeQuery } = require('../config/database');

async function getConversationSummary(userId, type, id) {
  if (type === 'direct') {
    const query = `
      DECLARE @userId INT = ?;
      DECLARE @contactId INT = ?;
      WITH conv AS (
        SELECT MAX(id) AS last_message_id, MAX(created_at) AS last_activity
        FROM messages
        WHERE (sender_id=@userId AND receiver_id=@contactId) OR (sender_id=@contactId AND receiver_id=@userId)
      )
      SELECT
        'direct' AS type,
        u.id AS id,
        u.name AS title,
        u.profile_image AS avatar,
        m.content AS last_message,
        conv.last_activity AS last_activity,
        (
          SELECT COUNT(*) FROM messages m2
          WHERE m2.sender_id=@contactId AND m2.receiver_id=@userId
            AND m2.created_at > ISNULL(cu.last_read_at, '1900-01-01')
        ) AS unread_count,
        ISNULL(cu.pinned, 0) AS pinned
      FROM conv
      JOIN users u ON u.id=@contactId
      LEFT JOIN messages m ON m.id=conv.last_message_id
      LEFT JOIN conversation_users cu ON cu.user_id=@userId AND cu.conversation_type='direct' AND cu.conversation_id=@contactId;
    `;
    const [rows] = await executeQuery(query, [userId, id]);
    const row = rows[0];
    return row
      ? {
          type: row.type,
          id: row.id.toString(),
          title: row.title,
          avatar: row.avatar,
          lastMessage: row.last_message,
          lastActivity: row.last_activity,
          unreadCount: row.unread_count,
          pinned: row.pinned,
        }
      : null;
  } else {
    const query = `
      DECLARE @userId INT = ?;
      DECLARE @groupId INT = ?;
      WITH conv AS (
        SELECT MAX(id) AS last_message_id, MAX(timestamp) AS last_activity
        FROM chat_messages
        WHERE group_id=@groupId
      )
      SELECT
        'group' AS type,
        g.id AS id,
        g.name AS title,
        NULL AS avatar,
        cm.content AS last_message,
        conv.last_activity AS last_activity,
        (
          SELECT COUNT(*) FROM chat_messages cm2
          WHERE cm2.group_id=@groupId
            AND cm2.timestamp > ISNULL(cu.last_read_at, '1900-01-01')
            AND cm2.sender_id <> @userId
        ) AS unread_count,
        ISNULL(cu.pinned, 0) AS pinned
      FROM conv
      JOIN chat_groups g ON g.id=@groupId
      LEFT JOIN chat_messages cm ON cm.id=conv.last_message_id
      LEFT JOIN conversation_users cu ON cu.user_id=@userId AND cu.conversation_type='group' AND cu.conversation_id=@groupId;
    `;
    const [rows] = await executeQuery(query, [userId, id]);
    const row = rows[0];
    return row
      ? {
          type: row.type,
          id: row.id.toString(),
          title: row.title,
          avatar: row.avatar,
          lastMessage: row.last_message,
          lastActivity: row.last_activity,
          unreadCount: row.unread_count,
          pinned: row.pinned,
        }
      : null;
  }
}

async function emitConversationUpdate(io, userId, type, id) {
  if (!io) return;
  const summary = await getConversationSummary(userId, type, id);
  if (summary) {
    io.to(`user:${userId}`).emit('conversation_update', summary);
  }
}

module.exports = { getConversationSummary, emitConversationUpdate };
