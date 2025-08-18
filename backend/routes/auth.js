const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { resolveProfileImage } = require('../utils/images');
const router = express.Router();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined');
}

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    const user = result.recordset && result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const id = Number(user.id);
    if (Number.isNaN(id)) {
      return res.status(500).json({ error: 'Invalid user ID' });
    }

    const token = jwt.sign(
      { id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const { password: _, profile_image, ...rest } = user;
    const userWithoutPassword = {
      ...rest,
      profileImage: await resolveProfileImage(profile_image)
    };

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Auth login error:', error);
    next(error);
  }
});

module.exports = router;
