const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all chat groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM chat_groups ORDER BY created_at DESC'
    );
    res.json(result.recordset);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create chat group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const createdBy = req.user.id;
    
    const result = await executeQuery(
      'INSERT INTO chat_groups (name, description, type, created_by) VALUES (?, ?, ?, ?)',
      [name, description, type, createdBy]
    );
    
    res.status(201).json({ id: result.recordset[0].id, message: 'Group created successfully' });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update chat group
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type } = req.body;
    
    await executeQuery(
      'UPDATE chat_groups SET name = ?, description = ?, type = ? WHERE id = ?',
      [name, description, type, id]
    );
    
    res.json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete chat group
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM chat_groups WHERE id = ?', [id]);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;