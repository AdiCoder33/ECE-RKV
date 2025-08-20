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
    const keys = JSON.stringify(subscription.keys || {});
    const topicsStr = topics.length ? JSON.stringify(topics) : null;

    await executeQuery('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    await executeQuery(
      'INSERT INTO push_subscriptions (endpoint, keys, topics, user_id) VALUES (?, ?, ?, ?)',
      [endpoint, keys, topicsStr, userId]
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
    const { subscription, payload = {} } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription required' });
    }

    await webpush.sendNotification(subscription, JSON.stringify(payload));
    res.json({ message: 'Push sent' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
