const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all chat groups with member counts
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await executeQuery(
      `SELECT g.id, g.name, g.description, g.type, g.created_by, g.created_at,
              COUNT(m.id) as member_count
       FROM chat_groups g
       LEFT JOIN chat_group_members m ON g.id = m.group_id
       GROUP BY g.id, g.name, g.description, g.type, g.created_by, g.created_at
       ORDER BY g.created_at DESC`
    );
    const formatted = result.recordset.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      type: g.type,
      createdBy: g.created_by,
      createdAt: g.created_at,
      memberCount: g.member_count
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Groups fetch error:', error);
    next(error);
  }
});

// Create chat group
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, type } = req.body;
    const createdBy = req.user.id;
    
    const result = await executeQuery(
      'INSERT INTO chat_groups (name, description, type, created_by) OUTPUT inserted.id VALUES (?, ?, ?, ?)',
      [name, description, type, createdBy]
    );

    res.status(201).json({ id: result.recordset[0].id, message: 'Group created successfully' });
  } catch (error) {
    console.error('Create group error:', error);
    next(error);
  }
});

// Update chat group
router.put('/:id', authenticateToken, async (req, res, next) => {
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
    next(error);
  }
});

// Delete chat group
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM chat_groups WHERE id = ?', [id]);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    next(error);
  }
});

// Get members of a chat group
router.get('/:id/members', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      `SELECT u.id, u.name, u.email
       FROM chat_group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?`,
      [id]
    );
    res.json(result.recordset);
  } catch (error) {
    console.error('Group members fetch error:', error);
    next(error);
  }
});

// Add member to chat group
router.post('/:id/members', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    await executeQuery(
      'INSERT INTO chat_group_members (group_id, user_id) VALUES (?, ?)',
      [id, userId]
    );
    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add group member error:', error);
    next(error);
  }
});

// Remove member from chat group
router.delete('/:id/members/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    await executeQuery(
      'DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Delete group member error:', error);
    next(error);
  }
});

module.exports = router;
