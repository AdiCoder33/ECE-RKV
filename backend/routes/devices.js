const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Register a device token
router.post('/register', authenticateToken, async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Ensure the token is unique across users
    await executeQuery('DELETE FROM device_tokens WHERE token = ?', [token]);
    await executeQuery(
      'INSERT INTO device_tokens (user_id, token, platform) VALUES (?, ?, ?)',
      [req.user.id, token, platform || null]
    );

    res.status(201).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error('Device registration error:', error);
    next(error);
  }
});

// Remove a device token
router.delete('/:token', authenticateToken, async (req, res, next) => {
  try {
    await executeQuery(
      'DELETE FROM device_tokens WHERE user_id = ? AND token = ?',
      [req.user.id, req.params.token]
    );
    res.json({ message: 'Device token removed' });
  } catch (error) {
    console.error('Device token removal error:', error);
    next(error);
  }
});

module.exports = router;
