const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery, connectDB, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await executeQuery(
      'SELECT id, name, email, role, department, year, section, roll_number, phone, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.recordset || []);
  } catch (error) {
    console.error('Users fetch error:', error);
    next(error);
  }
});

// Create user
router.post('/', authenticateToken, async (req, res, next) => {
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
      error.status = 400;
    }
    next(error);
  }
});

/**
 * Bulk create users.
 * Expects payload: { users: [{ name, email, password, role, department, year?, section?, rollNumber?, phone? }] }
 * Returns array with created record IDs or per-row error messages.
 */
router.post('/bulk', authenticateToken, async (req, res, next) => {
  const users = req.body?.users;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Users array is required' });
  }
  const results = [];
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      await transaction.save(`sp${i}`);
      try {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const request = new sql.Request(transaction);
        const result = await request
          .input('name', u.name)
          .input('email', u.email)
          .input('password', hashedPassword)
          .input('role', u.role)
          .input('department', u.department)
          .input('year', u.year || null)
          .input('section', u.section || null)
          .input('rollNumber', u.rollNumber || null)
          .input('phone', u.phone || null)
          .query(
            'INSERT INTO users (name, email, password, role, department, year, section, roll_number, phone) VALUES (@name, @email, @password, @role, @department, @year, @section, @rollNumber, @phone); SELECT SCOPE_IDENTITY() AS id;'
          );
        results.push({ index: i, id: result.recordset[0].id });
      } catch (err) {
        await transaction.rollback(`sp${i}`);
        results.push({ index: i, error: err.message });
      }
    }
    await transaction.commit();
    res.status(201).json({ results });
  } catch (error) {
    await transaction.rollback();
    console.error('Bulk user creation error:', error);
    next(error);
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, year, section, rollNumber } = req.body;
    
    await executeQuery(
      'UPDATE users SET name = ?, email = ?, role = ?, department = ?, year = ?, section = ?, roll_number = ? WHERE id = ?',
      [name, email, role, department, year || null, section || null, rollNumber || null, id]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
});

// Transfer HOD role
router.put('/:id/transfer-hod', authenticateToken, async (req, res, next) => {
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
    console.error('Transfer HOD role error:', error);
    next(error);
  }
});

module.exports = router;
