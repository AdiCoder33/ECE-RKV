const admin = require('firebase-admin');
const { executeQuery } = require('../config/database');
require('dotenv').config();

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
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
        `SELECT token FROM device_tokens WHERE user_id IN (${placeholders})`,
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
  module.exports = { sendToUsers: () => Promise.resolve() };
}
