const { executeQuery } = require('../config/database');

async function getConversationSummary(userId, type, id) {
  if (type === 'direct') {
    const query = `
      WITH last_msg AS (
        SELECT *
        FROM messages
        WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
        ORDER BY created_at DESC
        LIMIT 1
      )
      SELECT
        'direct' AS type,
        u.id AS id,
        u.name AS title,
        u.profile_image AS avatar,
        last_msg.content AS last_message,
        last_msg.created_at AS last_activity,
        (SELECT COUNT(*) FROM messages m2
           WHERE m2.sender_id=? AND m2.receiver_id=?
             AND m2.created_at > IFNULL(cu.last_read_at,'1900-01-01')
        ) AS unread_count,
        IFNULL(cu.pinned,0) AS pinned
      FROM last_msg
      JOIN users u ON u.id=?
      LEFT JOIN conversation_users cu
             ON cu.user_id=? AND cu.conversation_type='direct'
            AND cu.conversation_id=?;
    `;
    const [rows] = await executeQuery(query, [userId, id, id, userId, id, userId, id, userId, id]);
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
      WITH last_msg AS (
        SELECT *
        FROM chat_messages
        WHERE group_id=?
        ORDER BY timestamp DESC
        LIMIT 1
      )
      SELECT
        'group' AS type,
        g.id AS id,
        g.name AS title,
        NULL AS avatar,
        last_msg.content AS last_message,
        last_msg.timestamp AS last_activity,
        (
          SELECT COUNT(*) FROM chat_messages cm2
          WHERE cm2.group_id=?
            AND cm2.timestamp > IFNULL(cu.last_read_at,'1900-01-01')
            AND cm2.sender_id <> ?
        ) AS unread_count,
        IFNULL(cu.pinned,0) AS pinned
      FROM last_msg
      JOIN chat_groups g ON g.id=?
      LEFT JOIN conversation_users cu
             ON cu.user_id=? AND cu.conversation_type='group'
            AND cu.conversation_id=?;
    `;
    const [rows] = await executeQuery(query, [id, id, userId, id, userId, id]);
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
