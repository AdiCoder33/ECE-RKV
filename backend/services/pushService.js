const admin = require('firebase-admin');
require('dotenv').config();

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  const { executeQuery } = require('../config/database');

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }),
      });
    } catch (err) {
      console.error('Firebase admin init error:', err);
    }
  }

  async function sendToUsers(userIds, { title, body, data = {} }) {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
      const placeholders = userIds.map(() => '?').join(',');
      const { recordset } = await executeQuery(
        `SELECT dt.token FROM device_tokens dt JOIN users u ON dt.user_id = u.id WHERE dt.user_id IN (${placeholders}) AND u.push_enabled = 1`,
        userIds
      );
      const tokens = recordset.map((row) => row.token).filter(Boolean);
      if (!tokens.length) return;

      const payload = {
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      };

      const response = await admin.messaging().sendToDevice(tokens, payload);
      const staleTokens = [];
      response.results.forEach((result, idx) => {
        if (result.error) {
          console.error('Push token error:', result.error);
          const code = result.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            staleTokens.push(tokens[idx]);
          }
        }
      });

      if (staleTokens.length) {
        const placeholdersDel = staleTokens.map(() => '?').join(',');
        await executeQuery(
          `DELETE FROM device_tokens WHERE token IN (${placeholdersDel})`,
          staleTokens
        );
      }
    } catch (err) {
      console.error('sendToUsers error:', err);
    }
  }

  module.exports = { sendToUsers };
} else {
  const webpush = require('web-push');
  const { executeQuery } = require('../config/database');
  const { VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT } = process.env;

  if (VAPID_PUBLIC && VAPID_PRIVATE && VAPID_SUBJECT) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  }

  async function sendToUsers(userIds, { title, body, data = {} }) {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
      const placeholders = userIds.map(() => '?').join(',');
      const { recordset } = await executeQuery(
        `SELECT ps.endpoint, ps.keys_p256dh, ps.keys_auth FROM push_subscriptions ps JOIN users u ON ps.user_id = u.id WHERE ps.user_id IN (${placeholders}) AND u.push_enabled = 1`,
        userIds
      );

      if (!recordset.length) return;

      const payload = JSON.stringify({ title, body, data });
      for (const row of recordset) {
        const subscription = {
          endpoint: row.endpoint,
          keys: { p256dh: row.keys_p256dh, auth: row.keys_auth },
        };
        try {
          await webpush.sendNotification(subscription, payload);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await executeQuery('DELETE FROM push_subscriptions WHERE endpoint = ?', [row.endpoint]);
          } else {
            console.error('Web Push error:', err);
          }
        }
      }
    } catch (err) {
      console.error('sendToUsers error:', err);
    }
  }

  module.exports = { sendToUsers };
}
