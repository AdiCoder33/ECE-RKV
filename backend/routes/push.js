const express = require('express');
const webpush = require('web-push');
const { executeQuery } = require('../config/database');
require('dotenv').config();

const router = express.Router();

const { VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT } = process.env;
if (VAPID_PUBLIC && VAPID_PRIVATE && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// Return public VAPID key
router.get('/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// Save subscription
router.post('/subscribe', async (req, res, next) => {
  try {
    const { subscription, topics = [], userId = null } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || null;
    const auth = subscription.keys?.auth || null;
    const topicsStr = topics.length ? JSON.stringify(topics) : null;

    await executeQuery('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    await executeQuery(
      'INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth, topics, user_id) VALUES (?, ?, ?, ?, ?)',
      [endpoint, p256dh, auth, topicsStr, userId]
    );

    res.status(201).json({ message: 'Subscribed' });
  } catch (err) {
    next(err);
  }
});

// Remove subscription by endpoint
router.delete('/unsubscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    await executeQuery('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    next(err);
  }
});

// Send a push message
router.post('/', async (req, res, next) => {
  try {
    const { topics = [], userIds = [], payload = {} } = req.body;

    const clauses = [];
    const params = [];
    if (Array.isArray(topics) && topics.length) {
      const topicClauses = topics.map(() => 'topics LIKE ?').join(' OR ');
      topics.forEach((t) => params.push(`%"${t}"%`));
      clauses.push(`(${topicClauses})`);
    }
    if (Array.isArray(userIds) && userIds.length) {
      const placeholders = userIds.map(() => '?').join(',');
      clauses.push(`user_id IN (${placeholders})`);
      params.push(...userIds);
    }

    const where = clauses.length ? ` WHERE ${clauses.join(' OR ')}` : '';
    const { recordset } = await executeQuery(
      `SELECT endpoint, keys_p256dh, keys_auth FROM push_subscriptions${where}`,
      params
    );

    if (!recordset.length) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    const payloadStr = JSON.stringify(payload);
    for (const row of recordset) {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.keys_p256dh, auth: row.keys_auth },
      };
      try {
        await webpush.sendNotification(subscription, payloadStr);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await executeQuery('DELETE FROM push_subscriptions WHERE endpoint = ?', [row.endpoint]);
        } else {
          console.error('Web Push error:', err);
        }
      }
    }

    res.json({ message: 'Push sent' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
