const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { resolveProfileImage } = require('../utils/images');
const { generateOTP, sendOTPEmail } = require('../utils/otp');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined');
}

const otpExpiryMinutes = (() => {
  const value = parseInt(process.env.OTP_EXPIRY_MINUTES, 10);
  return Number.isNaN(value) || value <= 0 ? 10 : value;
})();

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

// Refresh JWT
router.get('/refresh', authenticateToken, (req, res) => {
  const { id, email, role } = req.user;
  const token = jwt.sign({ id, email, role }, jwtSecret, { expiresIn: '24h' });
  res.json({ token });
});

router.post('/request-reset', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    const user = result.recordset && result.recordset[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await executeQuery(
      'UPDATE users SET reset_otp = ?, reset_expires = DATEADD(minute, ?, SYSUTCDATETIME()) WHERE id = ?',
      [hashedOtp, otpExpiryMinutes, user.id]
    );
    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const result = await executeQuery(
      'SELECT reset_otp FROM users WHERE email = ? AND reset_expires > SYSUTCDATETIME()',
      [email]
    );
    const user = result.recordset && result.recordset[0];
    if (!user || !user.reset_otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const valid = await bcrypt.compare(otp, user.reset_otp);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    res.json({ message: 'OTP verified' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and newPassword are required' });
    }

    const result = await executeQuery(
      'SELECT id, reset_otp, reset_expires FROM users WHERE email = ?',
      [email]
    );
    const user = result.recordset && result.recordset[0];
    if (!user || !user.reset_otp || !user.reset_expires) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    if (new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const valid = await bcrypt.compare(otp, user.reset_otp);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Hashed new password for user', user.id);

    try {
      const updateResult = await executeQuery(
        'UPDATE users SET password = ?, reset_otp = NULL, reset_expires = NULL WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log('Password update result:', updateResult);
    } catch (updateError) {
      console.error('Password update error:', updateError);
      throw updateError;
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset failed:', error);
    next(error);
  }
});

router.post('/change-password', authenticateToken, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { id } = req.user; // set by authenticateToken
  const { recordset } = await executeQuery('SELECT password FROM users WHERE id = ?', [id]);
  const ok = await bcrypt.compare(currentPassword, recordset[0].password);
  if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await executeQuery('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
  res.json({ message: 'Password updated' });
});

module.exports = router;
