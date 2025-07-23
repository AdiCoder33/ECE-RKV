const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, department, year, section, rollNumber } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO users (name, email, role, department, year, section, rollNumber) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, role, department, year || null, section || null, rollNumber || null]
    );
    
    res.status(201).json({ message: 'User created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, year, section, rollNumber } = req.body;
    
    await db.execute(
      'UPDATE users SET name = ?, email = ?, role = ?, department = ?, year = ?, section = ?, rollNumber = ? WHERE id = ?',
      [name, email, role, department, year || null, section || null, rollNumber || null, id]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;