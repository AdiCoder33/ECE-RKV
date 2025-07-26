const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT id, name, email, role, department, year, section, roll_number, phone, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.recordset || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, role, department, year, section, rollNumber, phone } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await executeQuery(
      'INSERT INTO users (name, email, password, role, department, year, section, roll_number, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, department, year, section, rollNumber, phone]
    );
    
    res.status(201).json({ id: result.rowsAffected[0], message: 'User created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Email or roll number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, year, section, rollNumber } = req.body;
    
    await executeQuery(
      'UPDATE users SET name = ?, email = ?, role = ?, department = ?, year = ?, section = ?, roll_number = ? WHERE id = ?',
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
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Transfer HOD role
router.put('/:id/transfer-hod', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentHodId } = req.body;
    
    // Check if user exists and can be HOD
    const userResult = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)', 
      [id, 'professor', 'hod']
    );
    
    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found or cannot be assigned as HOD' });
    }
    
    // Update current HOD to professor if exists
    if (currentHodId) {
      await executeQuery(
        'UPDATE users SET role = ? WHERE id = ? AND role = ?',
        ['professor', currentHodId, 'hod']
      );
    }
    
    // Update new user to HOD
    await executeQuery(
      'UPDATE users SET role = ? WHERE id = ?',
      ['hod', id]
    );
    
    res.json({ message: 'HOD role transferred successfully' });
  } catch (error) {
    console.error('Error transferring HOD role:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;